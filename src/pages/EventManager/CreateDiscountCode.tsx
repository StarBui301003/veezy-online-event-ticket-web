import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getEventById } from "@/services/Event Manager/event.service";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import instance from "@/services/axios.customize";
import { AxiosError } from "axios";

interface Event {
  eventId: string;
  eventName: string;
}

interface CreateDiscountCodeData {
  eventId: string;
  code: string;
  discountType: number;
  value: number;
  minimum: number;
  maximum: number;
  maxUsage: number;
  expiredAt: string;
}

export default function CreateDiscountCode() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<CreateDiscountCodeData>({
    eventId: eventId || "",
    code: "",
    discountType: 0,
    value: 0,
    minimum: 0,
    maximum: 0,
    maxUsage: 2147483647,
    expiredAt: "",
  });

  useEffect(() => {
    const fetchEvent = async () => {
      if (!eventId) {
        toast.error("Event ID is required");
        navigate("/event-manager/discount-codes");
        return;
      }

      try {
        const data = await getEventById(eventId);
        if (!data) {
          toast.error("Event not found");
          navigate("/event-manager/discount-codes");
          return;
        }
        setEvent(data);
      } catch (err) {
        console.error("Failed to load event:", err);
        toast.error("Failed to load event details");
        navigate("/event-manager/discount-codes");
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [eventId, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form data
    if (!formData.code.trim()) {
      toast.error("Discount code is required");
      return;
    }
    if (formData.value <= 0) {
      toast.error("Discount value must be greater than 0");
      return;
    }
    if (formData.discountType === 0 && formData.value > 100) {
      toast.error("Percentage discount cannot exceed 100%");
      return;
    }
    if (!formData.expiredAt) {
      toast.error("Expiration date is required");
      return;
    }

    setLoading(true);

    try {
      const response = await instance.post("/api/DiscountCode", formData);
      if (response.data) {
        toast.success("Discount code created successfully!");
        navigate("/event-manager/discount-codes");
      } else {
        throw new Error("No response data");
      }
    } catch (err) {
      console.error("Failed to create discount code:", err);
      if (err instanceof AxiosError) {
        if (err.response?.status === 404) {
          toast.error("Event not found");
        } else if (err.response?.status === 400) {
          toast.error(err.response.data?.message || "Invalid discount code data");
        } else {
          toast.error("Failed to create discount code");
        }
      } else {
        toast.error("An unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1a0022] via-[#3a0ca3] to-[#ff008e]">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1a0022] via-[#3a0ca3] to-[#ff008e] py-10">
      <div className="w-full max-w-2xl mx-auto bg-[#2d0036]/80 rounded-2xl shadow-2xl p-8">
        <h2 className="text-2xl font-extrabold bg-gradient-to-r from-pink-400 to-yellow-400 bg-clip-text text-transparent mb-6 uppercase tracking-wide text-center">
          Create Discount Code
        </h2>
        {event && (
          <h3 className="text-xl font-bold text-yellow-300 mb-6 text-center">
            For Event: <span className="text-pink-200">{event.eventName}</span>
          </h3>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="code" className="text-white">Discount Code</Label>
            <Input
              id="code"
              type="text"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              className="bg-[#1a0022]/80 border-pink-500/30 text-white"
              placeholder="Enter discount code"
              required
            />
            <p className="text-xs text-pink-200/70">Enter a unique code for your discount</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="discountType" className="text-white">Discount Type</Label>
            <select
              id="discountType"
              value={formData.discountType}
              onChange={(e) => setFormData({ ...formData, discountType: Number(e.target.value) })}
              className="w-full p-3 rounded-xl bg-[#1a0022]/80 border-2 border-pink-500/30 text-white"
              required
            >
              <option value={0}>Percentage Discount</option>
              <option value={1}>Fixed Amount Discount</option>
            </select>
            <p className="text-xs text-pink-200/70">
              {formData.discountType === 0 
                ? "Discount will be applied as a percentage of the total amount" 
                : "Discount will be applied as a fixed amount"}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="value" className="text-white">
              {formData.discountType === 0 ? "Discount Percentage" : "Discount Amount"}
            </Label>
            <Input
              id="value"
              type="number"
              min="0"
              step={formData.discountType === 0 ? "0.01" : "1"}
              value={formData.value || ""}
              onChange={(e) => setFormData({ ...formData, value: Number(e.target.value) })}
              className="bg-[#1a0022]/80 border-pink-500/30 text-white"
              placeholder={formData.discountType === 0 ? "Enter percentage (0-100)" : "Enter amount"}
              required
            />
            <p className="text-xs text-pink-200/70">
              {formData.discountType === 0 
                ? "Enter a value between 0 and 100" 
                : "Enter the fixed amount to be discounted"}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="minimum" className="text-white">Minimum Order Amount</Label>
            <Input
              id="minimum"
              type="number"
              min="0"
              value={formData.minimum || ""}
              onChange={(e) => setFormData({ ...formData, minimum: Number(e.target.value) })}
              className="bg-[#1a0022]/80 border-pink-500/30 text-white"
              placeholder="Enter minimum order amount"
              required
            />
            <p className="text-xs text-pink-200/70">Minimum order amount required to apply this discount</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="maximum" className="text-white">Maximum Discount Amount</Label>
            <Input
              id="maximum"
              type="number"
              min="0"
              value={formData.maximum || ""}
              onChange={(e) => setFormData({ ...formData, maximum: Number(e.target.value) })}
              className="bg-[#1a0022]/80 border-pink-500/30 text-white"
              placeholder="Enter maximum discount amount (0 for no limit)"
              required
            />
            <p className="text-xs text-pink-200/70">Maximum amount that can be discounted (0 for no limit)</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxUsage" className="text-white">Maximum Usage</Label>
            <Input
              id="maxUsage"
              type="number"
              min="1"
              value={formData.maxUsage || ""}
              onChange={(e) => setFormData({ ...formData, maxUsage: Number(e.target.value) })}
              className="bg-[#1a0022]/80 border-pink-500/30 text-white"
              placeholder="Enter maximum usage count"
              required
            />
            <p className="text-xs text-pink-200/70">Maximum number of times this code can be used</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="expiredAt" className="text-white">Expiration Date</Label>
            <Input
              id="expiredAt"
              type="datetime-local"
              value={formData.expiredAt}
              onChange={(e) => setFormData({ ...formData, expiredAt: e.target.value })}
              className="bg-[#1a0022]/80 border-pink-500/30 text-white [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-100 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
              required
            />
            <p className="text-xs text-pink-200/70">When this discount code will expire</p>
          </div>

          <div className="flex gap-4 pt-4">
            <Button
              type="submit"
              className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
              disabled={loading}
            >
              {loading ? "Creating..." : "Create Discount Code"}
            </Button>
            <Button
              type="button"
              onClick={() => navigate("/event-manager/discount-codes")}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white"
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
} 