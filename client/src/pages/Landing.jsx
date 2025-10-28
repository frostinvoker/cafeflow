import React from "react";
import "../styles/Landing.css";

import Logo from "../assets/logo.png";
import Cup from "../assets/cup.png";
import Buy from "../assets/buy.png"; // tag image
import Coffee from "../assets/coffee.png";
import Drink from "../assets/drink.png";   // big central splash art
import Drinks from "../assets/drinks.png"; // mini icons / cup

export default function Landing() {
  return (
    <section className="hero">
      {/* Top-left logo */}
      <div className="hero__logoWrap">
        <img src={Logo} alt="Blue52 Cafe logo" className="hero__logo" loading="lazy" />
        <div>
          <h3 className="hero__title">Blue52 Cafe</h3>
          <p className="hero__subtitle">your neighborhood cafe</p>
        </div>
      </div>

      <div className="hero__inner">
        {/* LEFT */}
        <div className="hero__col hero__col--left">
          {/* 🔹 Buy tag image */}
          <div className="hero__tag">
            <img src={Buy} alt="Buy tag" className="hero__tagImage" loading="lazy" />
          </div>

          <p className="hero__lead">
            Serving freshly brewed coffee, delicious pastries, and warm smiles every day.
          </p>

          <button className="hero__cta">Order now</button>
      {/*  */}
          <div className="hero__smallImages" aria-hidden>
            <img src={Cup} alt="latte" className="hero__latte" loading="lazy" />
          </div>
        </div>

        {/* CENTER */}
        <div className="hero__col hero__col--center">
          <div className="hero__centerWrap">
            <div className="hero__splashBox">
              <img src={Drink} alt="center coffee splash" className="hero__centerImage" loading="lazy" />
            </div>
            +  <path
                d="M20 60 C40 20, 80 20, 70 10"
                stroke="#2EA8FF"
                strokeWidth="4"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M70 10 L64 16 M70 10 L76 14"
                stroke="#2EA8FF"
                strokeWidth="3"
                strokeLinecap="round"
              />
          </div>
        </div>

        {/* RIGHT */}
        <div className="hero__col hero__col--right">

          <div className="hero__miniGrid" aria-hidden>
            <img src={Drinks} alt="mini cup" className="hero__mini" />
          </div>
          <p className="hero__cardText">
            Come and see the difference a perfect cup makes. Experience the rich aroma, smooth flavor, and cozy atmosphere that make every sip unforgettable. Wether you're starting your day or taking a break, we're here to brew your moment.
          </p>
        </div>
     
        <div className="hero__col hero__col--bottom">
          <div className="hero__card">
            <h4>Visit Our Shop</h4>
            <p className="hero__footNote">
              A customer at Blue52 Cafe is someone who enjoys high-quality coffee, a relaxing atmosphere, and exceptional service, making every visit a soothing experience.
            </p>
          </div>
        </div>

        {/* decorative tilted cup at bottom-right */}
        <img src={Coffee} alt="" className="hero__tiltCup" aria-hidden />
      </div>
    </section>
  );
}
