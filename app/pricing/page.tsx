"use client";

import { Check } from "lucide-react";
import { useState } from "react";

const plans = [
  {
    name: "Basic",
    credits: 100,
    price: 299,
    popular: false,
    description: "Perfect for testing AI image generation.",
    features: ["100 AI Image Credits", "Standard Resolution", "Community Support"],
  },
  {
    name: "Pro",
    credits: 500,
    price: 899,
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
  // Kaunsa plan load ho raha hai usko track karne ke liye
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const handleRazorpayPayment = async (planName: string, planPrice: number) => {
    setLoadingPlan(planName);

    try {
      // 1. Razorpay ka script load karna
      const loadScript = () => {
        return new Promise((resolve) => {
          const script = document.createElement("script");
          script.src = "https://checkout.razorpay.com/v1/checkout.js";
          script.onload = () => resolve(true);
          script.onerror = () => resolve(false);
          document.body.appendChild(script);
        });
      };

      const res = await loadScript();
      if (!res) {
        alert("Razorpay load nahi hua. Apna internet check karein!");
        setLoadingPlan(null);
        return;
      }

      // 2. Apne backend ko batana ki kitne paise ka order banana hai
      const response = await fetch("/api/razorpay", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ amount: planPrice }),
      });

      const data = await response.json();

      if (!data.orderId) {
        alert("Order create karne mein error aayi!");
        setLoadingPlan(null);
        return;
      }

      // 3. Razorpay Popup (Modal) ki Settings
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: data.amount,
        currency: "INR",
        name: "Studio AI",
        description: `${planName} Plan Subscription`,
        order_id: data.orderId,
        handler: function (response: any) {
          // Yahan hum baad mein database update (credits add) wala webhook lagayenge
          console.log("Payment Success!", response);
          alert(`Payment Successful! Aapka ${planName} plan activate ho gaya hai! 🎉`);
        },
        theme: {
          color: "#eab308", // Aapke design ke best value badge se match karta hua Yellow
        },
      };

      const paymentObject = new (window as any).Razorpay(options);
      paymentObject.open();
    } catch (error) {
      console.error("Checkout Error:", error);
      alert("Something went wrong with the checkout process.");
    } finally {
      setLoadingPlan(null);
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
                onClick={() => handleRazorpayPayment(plan.name, plan.price)}
                disabled={loadingPlan === plan.name}
                className={`w-full py-3 rounded-lg font-bold transition-all ${
                  plan.popular
                    ? "bg-yellow-400 text-black hover:bg-yellow-500"
                    : "bg-gray-800 text-white hover:bg-gray-700"
                }`}
              >
                {loadingPlan === plan.name ? "Processing..." : `Get ${plan.credits} Credits`}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}