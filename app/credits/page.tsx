"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Coins, Image, Video } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

interface CreditInfo {
  type: "image" | "video";
  amount: number;
}

export default function Component() {
  const [credits, setCredits] = useState<CreditInfo[]>([]);
  const [rechargeType, setRechargeType] = useState<"image" | "video">("image");
  const [rechargeAmount, setRechargeAmount] = useState("");
  const [calculatedCredits, setCalculatedCredits] = useState(0);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);

  const supabase = createClient();

  const RAZORPAY_KEY_ID = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;

  // Load Razorpay script
  useEffect(() => {
    const loadRazorpayScript = () => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => setRazorpayLoaded(true);
      script.onerror = () => console.error("Failed to load Razorpay script");
      document.body.appendChild(script);
    };

    loadRazorpayScript();
  }, []);

  useEffect(() => {
    const fetchCredits = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user && user.email) {
        setUserEmail(user.email);
        const { data, error } = await supabase
          .from("users")
          .select("image_credits, video_credits")
          .eq("email", user.email)
          .single();

        if (error) {
          console.error("Error fetching user credits:", error.message);
        } else if (data) {
          setCredits([
            { type: "image", amount: data.image_credits },
            { type: "video", amount: data.video_credits },
          ]);
        }
      }
    };

    fetchCredits();
  }, [supabase]);

  // Calculate the credits the user will get based on the INR entered
  useEffect(() => {
    const amount = parseInt(rechargeAmount, 10);
    if (!isNaN(amount)) {
      let creditsToAdd = 0;
      let errorMessage = "";

      // New pricing structure with minimum recharge amounts
      if (rechargeType === "image") {
        if (amount >= 10) {
          creditsToAdd = amount; // 1 image credit = ₹1, minimum ₹10
        } else {
          creditsToAdd = 0; // Show error message if below minimum
          errorMessage = "Minimum recharge for images is ₹10";
        }
      } else if (rechargeType === "video") {
        if (amount >= 100) {
          creditsToAdd = amount / 20; // 1 video credit = ₹20, minimum ₹100
        } else {
          creditsToAdd = 0; // Show error message if below minimum
          errorMessage = "Minimum recharge for videos is ₹100";
        }
      }

      setCalculatedCredits(creditsToAdd);
      setErrorMessage(errorMessage);
    } else {
      setCalculatedCredits(0);
      setErrorMessage("");
    }
  }, [rechargeAmount, rechargeType]);

  // Handle Razorpay payment
  const initiatePayment = async () => {
    if (!razorpayLoaded) {
      console.error("Razorpay SDK not loaded");
      return;
    }

    const amountInPaise = parseInt(rechargeAmount, 10) * 100; // Convert to paise for Razorpay

    if (!amountInPaise || amountInPaise <= 0) return;

    const options = {
      key: RAZORPAY_KEY_ID, // Razorpay Key ID
      amount: amountInPaise,
      currency: "INR",
      name: "Credits Recharge",
      description: `Recharge for ${calculatedCredits} ${rechargeType} credits`,
      handler: async (response: any) => {
        await handleRecharge(response);
      },
      prefill: {
        email: userEmail,
      },
    };

    const rzp = new (window as any).Razorpay(options);
    rzp.open();
  };

  // Handle recharge credits after successful payment
  const handleRecharge = async (paymentResponse: any) => {
    if (!userEmail || calculatedCredits <= 0) return;

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error("Error retrieving user:", authError?.message);
      return;
    }

    // Update the credits in the local state and Supabase
    const updatedCredits = credits.map((credit) =>
      credit.type === rechargeType
        ? { ...credit, amount: credit.amount + calculatedCredits }
        : credit
    );
    setCredits(updatedCredits);

    const newCredits =
      rechargeType === "image"
        ? {
            image_credits: updatedCredits.find((c) => c.type === "image")
              ?.amount,
          }
        : {
            video_credits: updatedCredits.find((c) => c.type === "video")
              ?.amount,
          };

    const { error: creditUpdateError } = await supabase
      .from("users")
      .update(newCredits)
      .eq("email", userEmail);

    if (creditUpdateError) {
      console.error("Error updating credits:", creditUpdateError.message);
      return;
    }

    // Save transaction to credit_transactions table
    const transactionData = {
      user_id: user.id,
      amount: parseInt(rechargeAmount, 10),
      transaction_type: rechargeType,
      email: userEmail,
    };

    const { error: transactionError } = await supabase
      .from("credit_transactions")
      .insert([transactionData]);

    if (transactionError) {
      console.error("Error saving transaction:", transactionError.message);
    } else {
      console.log("Transaction saved successfully:", paymentResponse);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Current Credits</CardTitle>
            <CardDescription>
              Your available image and video credits
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {credits.map((credit) => (
                <div
                  key={credit.type}
                  className="flex items-center justify-between p-2 bg-secondary rounded-md"
                >
                  <div className="flex items-center space-x-2">
                    {credit.type === "image" ? (
                      <Image className="w-5 h-5 text-primary" />
                    ) : (
                      <Video className="w-5 h-5 text-primary" />
                    )}
                    <span className="font-normal capitalize">
                      {credit.type} Credits:
                    </span>
                  </div>
                  <span className="font-normal">{credit.amount}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recharge Credits</CardTitle>
            <CardDescription>Add more credits to your account</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid w-full items-center gap-4">
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="creditType">Credit Type</Label>
                <Select
                  value={rechargeType}
                  onValueChange={(value: "image" | "video") =>
                    setRechargeType(value)
                  }
                >
                  <SelectTrigger id="creditType">
                    <SelectValue placeholder="Select credit type" />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    <SelectItem value="image">Image Credits</SelectItem>
                    <SelectItem value="video">Video Credits</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="amount">Amount (INR)</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="Enter amount"
                  value={rechargeAmount}
                  onChange={(e) => setRechargeAmount(e.target.value)}
                />
                {rechargeAmount &&
                  (errorMessage ? (
                    <p className="text-sm text-red-500">{errorMessage}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      You will get {calculatedCredits} {rechargeType} credits
                    </p>
                  ))}
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full" onClick={initiatePayment}>
              <Coins className="w-4 h-4 mr-2" />
              Recharge & Pay with Razorpay
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
