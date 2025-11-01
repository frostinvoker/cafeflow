import { useCallback, useEffect, useMemo, useState } from "react";

const API_BASE =
  (import.meta?.env?.VITE_API_URL ?? "http://localhost:5000") + "/api";

// Helpers
const isDrink = (cat = "") => cat.toLowerCase() === "drinks";
const safeNumber = (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);
const moneyPHP = (n) =>
  typeof n === "number"
    ? new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
      }).format(n)
    : "—";

export function usePos() {
  // remote data
  const [items, setItems] = useState([]);
  const [addons, setAddons] = useState([]);

  // ui/meta
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  //category tabs
  const [activeTab, setActiveTab] = useState("Drinks");

  // order/cart
  const [order, setOrder] = useState([]);

  // config modal state
  const [showConfig, setShowConfig] = useState(false);
  const [configItem, setConfigItem] = useState(null);
  const [configQty, setConfigQty] = useState(1);
  const [configAddonIds, setConfigAddonIds] = useState([]);
  const [configSize, setConfigSize] = useState("12oz");

  // ====== load menu ======
  const loadMenu = useCallback(async (signal) => {
    const res = await fetch(`${API_BASE}/menu-items`, {
      credentials: "include",
      signal,
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error(data?.message || "Failed to load menu");
    setItems(Array.isArray(data) ? data : []);
  }, []);

  const loadAddons = useCallback(async (signal) => {
    const res = await fetch(`${API_BASE}/addons?active=true`, {
      credentials: "include",
      signal,
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error(data?.message || "Failed to load add-ons");
    setAddons(Array.isArray(data) ? data : []);
  }, []);

  const categoryOptions = useMemo(() => ["Drinks", "Snacks", "Meals"], []);
  const filteredItems = useMemo(
    () => items.filter((it) => it.category === activeTab),
    [items, activeTab]
  );

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      setLoading(true);
      setErr("");
      try {
        await Promise.all([
          loadMenu(controller.signal),
          loadAddons(controller.signal),
        ]);
      } catch (e) {
        if (e.name !== "AbortError")
          setErr(e.message || "Could not load POS data");
      } finally {
        setLoading(false);
      }
    })();
    return () => controller.abort();
  }, [loadMenu, loadAddons]);

  // ====== config modal ======
  const openConfig = useCallback((it) => {
    const avail = Boolean(
      it?.effectiveAvailable ??
        ((it?.available ?? true) && (it?.availableComputed ?? true))
    );
    if (!avail) return;
    setConfigItem(it);
    setConfigQty(1);
    setConfigAddonIds([]);
    setConfigSize("12oz");
    setShowConfig(true);
  }, []);

  const closeConfig = useCallback(() => setShowConfig(false), []);

  // Add-ons filtered by current item’s category + allowedAddOns (if set)
  const selectableAddons = useMemo(() => {
    if (!configItem) return [];
    let list = addons.filter((a) => a?.active !== false);
    if (configItem.category)
      list = list.filter((a) => a.category === configItem.category);

    const allowed = (configItem.allowedAddOns || []).map(String);
    if (allowed.length > 0)
      list = list.filter((a) => allowed.includes(String(a._id)));
    return list;
  }, [addons, configItem]);

  const toggleAddon = useCallback((id) => {
    setConfigAddonIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }, []);

  // ====== order ops ======
  const addConfiguredLine = useCallback(() => {
    if (!configItem) return;

    const chosen = selectableAddons.filter((a) =>
      configAddonIds.includes(String(a._id))
    );
    const basePrice = isDrink(configItem.category)
      ? configSize === "16oz"
        ? safeNumber(configItem.sizePrices?.oz16, 0)
        : safeNumber(configItem.sizePrices?.oz12, 0)
      : safeNumber(configItem.price, 0);

    const line = {
      lineId: crypto?.randomUUID?.() ?? String(Date.now() + Math.random()),
      menuItemId: configItem._id,
      name: configItem.name,
      category: configItem.category,
      size: isDrink(configItem.category) ? configSize : undefined,
      basePrice,
      quantity: safeNumber(configQty, 1),
      addons: chosen.map((a) => ({
        _id: a._id,
        name: a.name,
        price: safeNumber(a.price, 0),
      })),
    };

    setOrder((prev) => [...prev, line]);
    setShowConfig(false);
  }, [configItem, configSize, configQty, configAddonIds, selectableAddons]);

  const removeFromOrder = useCallback((lineId) => {
    setOrder((prev) => prev.filter((li) => li.lineId !== lineId));
  }, []);

  const total = useMemo(
    () =>
      order.reduce((sum, li) => {
        const addonsTotal = (li.addons || []).reduce(
          (s, a) => s + (a.price || 0),
          0
        );
        return sum + (li.basePrice + addonsTotal) * (li.quantity || 1);
      }, 0),
    [order]
  );

  // For navigation layer: produce a serializable state for checkout
  const buildCheckoutState = useCallback(() => {
    const itemsPayload = order.map((li) => ({
      menuItem: li.menuItemId,
      quantity: li.quantity,
      addons: (li.addons || []).map((a) => a._id),
      size: li.size,
    }));
    return { order, itemsPayload, total };
  }, [order, total]);

  return {
    // remote
    items,
    addons,

    // meta
    loading,
    err,
    setErr,

    // order
    order,
    total,
    removeFromOrder,

    // config modal state + actions
    showConfig,
    configItem,
    configQty,
    setConfigQty,
    configAddonIds,
    configSize,
    setConfigSize,
    openConfig,
    closeConfig,
    selectableAddons,
    toggleAddon,
    addConfiguredLine,

    // utils
    moneyPHP,

    // checkout
    buildCheckoutState,

    //tabs
    activeTab,
    setActiveTab,
    categoryOptions,
    filteredItems,
  };
}
