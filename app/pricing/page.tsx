"use client";

import { Check } from "lucide-react";
import { useState } from "react";

const plans = [
  {
    name: "Basic",
    credits: 100,
    price: 299,
    priceId: process.env.NEXT_PUBLIC_STRIPE_BASIC_PRICE_ID,
    popular: false,
    description: "Perfect for testing AI image generation.",
    features: ["100 AI Image Credits", "Standard Resolution", "Community Support"],
  },
  {
    name: "Pro",
    credits: 500,
    price: 899,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID,
    popular: true, // VIP Badge trigger
    description: "For regular users who want more AI power.",
    features: [
      "500 AI Image Credits",
      "High-Quality 4K Generation",
      "Priority Support",
      "VIP PRO Badge on Profile",
    ],
  },
];

export default function PricingPage() {
  const [loading, setLoading] = useState(false);

  const handleCheckout = async (priceId: string | undefined) => {
    if (!priceId) return alert("Price ID not found in .env.local!");
    setLoading(true);
    
    try {
      // Backend API ko Price ID bhej rahe hain
      const response = await fetch("/api/stripe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ priceId }),
      });

      const data = await response.json();

      if (data.url) {
        // Stripe ke payment page par user ko bhej do
        window.location.href = data.url;
      } else {
        alert("Payment failed: " + data.error);
      }
    } catch (error) {
      console.error("Checkout Error:", error);
      alert("Something went wrong with the checkout process.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white py-20 px-4">
      <div className="max-w-7xl mx-auto text-center">
        <h1 className="text-4xl md:text-6xl font-black mb-6 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
          Upgrade Your AI Power
        </h1>
        <p className="text-gray-400 text-lg mb-12 max-w-2xl mx-auto">
          Choose the perfect plan to generate stunning AI images. Buy more credits to get massive bulk discounts!
        </p>

        {/* Grid adjusted for 2 columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10 max-w-4xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl p-8 border ${
                plan.popular
                  ? "border-yellow-400 bg-gray-900 shadow-2xl shadow-yellow-500/20 scale-105"
                  : "border-gray-800 bg-gray-950"
              } flex flex-col`}
            >
              {plan.popular && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <span className="bg-yellow-400 text-black px-4 py-1 rounded-full text-sm font-black uppercase tracking-wider">
                    Best Value
                  </span>
                </div>
              )}

              <h3 className="text-2xl font-bold text-gray-100">{plan.name}</h3>
              <p className="text-gray-400 mt-2 text-sm h-10">{plan.description}</p>
              
              <div className="my-6">
                <span className="text-5xl font-black">₹{plan.price}</span>
                <span className="text-gray-400"> / month</span>
              </div>

              <ul className="space-y-4 mb-8 flex-1 text-left">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center text-gray-300">
                    <Check className="h-5 w-5 text-yellow-400 mr-3 shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleCheckout(plan.priceId)}
                disabled={loading}
                className={`w-full py-3 rounded-lg font-bold transition-all ${
                  plan.popular
                    ? "bg-yellow-400 text-black hover:bg-yellow-500"
                    : "bg-gray-800 text-white hover:bg-gray-700"
                }`}
              >
                {loading ? "Processing..." : `Get ${plan.credits} Credits`}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}