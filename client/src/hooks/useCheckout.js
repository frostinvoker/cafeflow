import { useCallback, useEffect, useMemo, useState } from "react";

const API_BASE =
  (import.meta?.env?.VITE_API_URL ?? "http://localhost:5000") + "/api";

const moneyPHP = (n) =>
  typeof n === "number"
    ? new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
      }).format(n)
    : "—";

export function useCheckout(initial = {}) {
  // ========= order / payload =========
  const [order, setOrder] = useState(initial.order || []);
  const [itemsPayload, setItemsPayload] = useState(initial.itemsPayload || []);

  // ========= payment =========
  const [paymentMethod, setPaymentMethod] = useState("cash"); // "cash" | "gcash"
  const [tendered, setTendered] = useState("");
  const total = useMemo(() => {
    return (order || []).reduce((sum, li) => {
      const addonsTotal = (li.addons || []).reduce(
        (s, a) => s + (a.price || 0),
        0
      );
      return (
        sum +
        (Number(li.basePrice || 0) + addonsTotal) * Number(li.quantity || 1)
      );
    }, 0);
  }, [order]);
  const change = useMemo(
    () => Math.max(0, Number(tendered) - total),
    [tendered, total]
  );

  // ========= customers =========
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [customerQuery, setCustomerQuery] = useState("");
  const [allCustomers, setAllCustomers] = useState([]);
  const [customerResults, setCustomerResults] = useState([]);
  const [custLoading, setCustLoading] = useState(false);

  // ========= confirm modal =========
  const [showConfirmPayment, setShowConfirmPayment] = useState(false);
  const openConfirmPayment = useCallback(() => setShowConfirmPayment(true), []);
  const closeConfirmPayment = useCallback(
    () => setShowConfirmPayment(false),
    []
  );

  // ========= loyalty points / redeem =========
  const [redeemFreeDrink, setRedeemFreeDrink] = useState(false);
  const pointsEarned = useMemo(() => Math.floor(total * 0.1), [total]);
  const isSingleDrink = useMemo(() => {
    if ((order?.length || 0) !== 1) return false;
    const cat = (order[0]?.category || "").toLowerCase();
    return ["drink", "drinks", "beverage", "beverages"].includes(cat);
  }, [order]);
  const canRedeem =
    !!selectedCustomer &&
    (selectedCustomer.loyaltyPoints ?? 0) >= 100 &&
    isSingleDrink;
  const earnToShow = redeemFreeDrink ? 0 : pointsEarned;

  // ========= persist to localStorage =========
  useEffect(() => {
    try {
      localStorage.setItem(
        "posOrder",
        JSON.stringify({
          order,
          itemsPayload,
          total,
          selectedCustomerId: selectedCustomer?._id || null,
        })
      );
    } catch {}
  }, [order, itemsPayload, total, selectedCustomer]);

  // Build itemsPayload from order if it’s empty and order exists
  useEffect(() => {
    if ((itemsPayload || []).length || (order || []).length === 0) return;
    const built = (order || []).map((li) => ({
      menuItem: li.menuItemId || li._id,
      quantity: Number(li.quantity) || 1,
      size: li.size || undefined, // only for drinks
      addons: (li.addons || []).map((a) => a._id || a.addonId).filter(Boolean),
    }));
    setItemsPayload(built);
  }, [order, itemsPayload]);
  useEffect(() => {
    if (paymentMethod === "gcash") {
      setTendered(total.toFixed(2));
    }
  }, [paymentMethod, total]);
  // ========= customer search (debounced while modal open) =========
  useEffect(() => {
    if (!showCustomerModal) return;
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        setCustLoading(true);
        const url = customerQuery.trim()
          ? `${API_BASE}/customers?q=${encodeURIComponent(customerQuery)}`
          : `${API_BASE}/customers`;
        const res = await fetch(url, {
          credentials: "include",
          signal: ctrl.signal,
        });
        if (!res.ok) return;
        const data = await res.json();
        if (customerQuery.trim())
          setCustomerResults(Array.isArray(data) ? data : []);
        else setAllCustomers(Array.isArray(data) ? data : []);
      } finally {
        setCustLoading(false);
      }
    }, 250);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [showCustomerModal, customerQuery]);

  const openCustomerModal = useCallback(() => {
    setShowCustomerModal(true);
    setCustomerQuery("");
    setCustomerResults([]);
  }, []);
  const closeCustomerModal = useCallback(() => setShowCustomerModal(false), []);
  const selectCustomer = useCallback((c) => {
    setSelectedCustomer(c);
    setRedeemFreeDrink(false);
    setShowCustomerModal(false);
  }, []);
  const clearSelectedCustomer = useCallback(() => {
    setSelectedCustomer(null);
    setRedeemFreeDrink(false);
    setShowCustomerModal(false);
  }, []);

  const customerList = useMemo(
    () => (customerQuery.trim() ? customerResults : allCustomers),
    [customerQuery, customerResults, allCustomers]
  );

  // ========= payment submit =========
  const confirmPayment = useCallback(async () => {
    try {
      const isGCash = paymentMethod === "gcash";

      if (!isGCash) {
        if (tendered === "" || tendered === null) {
          throw new Error("Please enter cash received.");
        }
        if (Number(tendered) < total) {
          throw new Error("Cash received is less than the total amount.");
        }
      }
      const body = {
        items: itemsPayload,
        paymentMethod,
        payment: {
          tendered: paymentMethod === "gcash" ? total : Number(tendered) || 0,
          referenceId: paymentMethod === "gcash" ? `GCASH-${Date.now()}` : "",
        },
        status: "completed",
        customer: selectedCustomer?._id || undefined,
        redeemFreeDrink: canRedeem && redeemFreeDrink,
      };
      const res = await fetch(`${API_BASE}/checkouts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      const created = await res.json().catch(() => null);
      if (!res.ok)
        throw new Error(created?.message || "Failed to create checkout");

      try {
        localStorage.removeItem("posOrder");
      } catch {}
      return created?._id || null; // let the component decide how to navigate
    } catch (e) {
      throw new Error(e.message || "Payment failed");
    }
  }, [
    itemsPayload,
    paymentMethod,
    tendered,
    selectedCustomer,
    canRedeem,
    redeemFreeDrink,
  ]);

  return {
    // order / payload
    order,
    itemsPayload,

    // payment
    paymentMethod,
    setPaymentMethod,
    tendered,
    setTendered,
    total,
    change,

    // customers
    selectedCustomer,
    selectCustomer,
    clearSelectedCustomer,
    showCustomerModal,
    openCustomerModal,
    closeCustomerModal,
    customerQuery,
    setCustomerQuery,
    customerList,
    custLoading,

    // confirm modal
    showConfirmPayment,
    openConfirmPayment,
    closeConfirmPayment,

    // loyalty
    canRedeem,
    redeemFreeDrink,
    setRedeemFreeDrink,
    pointsEarned,
    earnToShow,

    // actions
    confirmPayment,

    // utils
    moneyPHP,
  };
}
