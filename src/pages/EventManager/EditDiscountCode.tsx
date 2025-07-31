import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getDiscountCodeById, updateDiscountCode } from "@/services/Event Manager/event.service";
import { format, parseISO } from "date-fns";
import { useTranslation } from 'react-i18next';

interface DiscountCode {
  discountId: string;
  eventId: string;
  eventName: string;
  code: string;
  discountType: number;
  value: number;
  minimum: number;
  maximum: number;
  maxUsage: number;
  usedCount: number;
  expiredAt: string;
  isExpired: boolean;
}

export default function EditDiscountCode() {
  const { t } = useTranslation();
  const { discountId } = useParams<{ discountId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [discountCode, setDiscountCode] = useState<DiscountCode | null>(null);
  const [formData, setFormData] = useState({
    code: "",
    discountType: 0,
    value: 0,
    minimum: 0,
    maximum: 0,
    maxUsage: 2147483647,
    expiredAt: "",
  });

  useEffect(() => {
    const fetchDiscountCode = async () => {
      if (!discountId) {
        toast.error(t("discountCodeIdRequired"));
        navigate("/event-manager/discount-codes");
        return;
      }

      try {
        const data = await getDiscountCodeById(discountId);
        if (!data) {
          toast.error(t("discountCodeNotFound"));
          navigate("/event-manager/discount-codes");
          return;
        }
        
        setDiscountCode(data);
        setFormData({
          code: data.code,
          discountType: data.discountType,
          value: data.value,
          minimum: data.minimum,
          maximum: data.maximum,
          maxUsage: data.maxUsage,
          expiredAt: format(parseISO(data.expiredAt), "yyyy-MM-dd'T'HH:mm"),
        });
      } catch (err) {
        console.error("Failed to load discount code:", err);
        toast.error(t("failedToLoadDiscountCode"));
        navigate("/event-manager/discount-codes");
      } finally {
        setLoading(false);
      }
    };

    fetchDiscountCode();
  }, [discountId, navigate, t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!discountId || !discountCode) {
      toast.error(t("invalidDiscountCode"));
      return;
    }

    // Validation
    if (!formData.code.trim()) {
      toast.error(t("discountCodeRequired"));
      return;
    }
    if (formData.value <= 0) {
      toast.error(t("discountValueMustBePositive"));
      return;
    }
    if (formData.discountType === 0 && formData.value > 100) {
      toast.error(t("percentageCannotExceed100"));
      return;
    }
    if (!formData.expiredAt) {
      toast.error(t("expirationDateRequired"));
      return;
    }

    setLoading(true);

    try {
      const response = await updateDiscountCode(discountId, formData);
      if (response) {
        toast.success(t("discountCodeUpdated"));
        navigate("/event-manager/discount-codes");
      }
    } catch (err) {
      console.error("Failed to update discount code:", err);
      toast.error(t("failedToUpdateDiscountCode"));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1a0022] via-[#3a0ca3] to-[#ff008e]">
        <div className="text-white text-xl">{t("loading")}...</div>
      </div>
    );
  }

  if (!discountCode) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1a0022] via-[#3a0ca3] to-[#ff008e]">
        <div className="text-white text-xl">{t("discountCodeNotFound")}</div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1a0022] via-[#3a0ca3] to-[#ff008e] py-10">
      <div className="w-full max-w-2xl mx-auto bg-[#2d0036]/80 rounded-2xl shadow-2xl p-8">
        <h2 className="text-2xl font-extrabold bg-gradient-to-r from-pink-400 to-yellow-400 bg-clip-text text-transparent mb-6 uppercase tracking-wide text-center">
          {t("editDiscountCode")}
        </h2>
        
        <h3 className="text-xl font-bold text-yellow-300 mb-6 text-center">
          {t("forEvent")}: <span className="text-pink-200">{discountCode.eventName}</span>
        </h3>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="code" className="text-white">{t("discountCode")}</Label>
            <Input
              id="code"
              type="text"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              className="bg-[#1a0022]/80 border-pink-500/30 text-white"
              placeholder="SUMMER20"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="discountType" className="text-white">{t("discountType")}</Label>
            <select
              id="discountType"
              value={formData.discountType}
              onChange={(e) => setFormData({ ...formData, discountType: Number(e.target.value) })}
              className="w-full p-3 rounded-xl bg-[#1a0022]/80 border-2 border-pink-500/30 text-white"
              required
            >
              <option value={0}>{t("percentage")}</option>
              <option value={1}>{t("fixedAmount")}</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="value" className="text-white">
              {formData.discountType === 0 ? t("percentage") : t("fixedAmount")}
            </Label>
            <Input
              id="value"
              type="number"
              min="0"
              step={formData.discountType === 0 ? "0.01" : "1"}
              value={formData.value}
              onChange={(e) => setFormData({ ...formData, value: Number(e.target.value) })}
              className="bg-[#1a0022]/80 border-pink-500/30 text-white"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="minimum" className="text-white">{t("minOrderAmount")}</Label>
            <Input
              id="minimum"
              type="number"
              min="0"
              value={formData.minimum}
              onChange={(e) => setFormData({ ...formData, minimum: Number(e.target.value) })}
              className="bg-[#1a0022]/80 border-pink-500/30 text-white"
              required
            />
          </div>

          {formData.discountType === 0 && (
            <div className="space-y-2">
              <Label htmlFor="maximum" className="text-white">{t("maxDiscountAmount")}</Label>
              <Input
                id="maximum"
                type="number"
                min="0"
                value={formData.maximum}
                onChange={(e) => setFormData({ ...formData, maximum: Number(e.target.value) })}
                className="bg-[#1a0022]/80 border-pink-500/30 text-white"
                required
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="maxUsage" className="text-white">{t("maxUsage")}</Label>
            <Input
              id="maxUsage"
              type="number"
              min="1"
              value={formData.maxUsage === 2147483647 ? "" : formData.maxUsage}
              onChange={(e) => setFormData({ 
                ...formData, 
                maxUsage: e.target.value ? Number(e.target.value) : 2147483647 
              })}
              className="bg-[#1a0022]/80 border-pink-500/30 text-white"
            />
            <p className="text-xs text-pink-200">
              {t("leaveBlankForUnlimited")}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="expiredAt" className="text-white">{t("expirationDate")}</Label>
            <Input
              id="expiredAt"
              type="datetime-local"
              value={formData.expiredAt}
              onChange={(e) => setFormData({ ...formData, expiredAt: e.target.value })}
              className="bg-[#1a0022]/80 border-pink-500/30 text-white [&::-webkit-calendar-picker-indicator]:invert"
              required
            />
            {discountCode.isExpired && (
              <p className="text-xs text-red-400">
                {t("currentlyExpired")}
              </p>
            )}
          </div>

          <div className="pt-4 flex gap-4">
            <Button
              type="submit"
              className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
              disabled={loading}
            >
              {loading ? t("updating") : t("updateDiscountCode")}
            </Button>
            <Button
              type="button"
              onClick={() => navigate("/event-manager/discount-codes")}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white"
            >
              {t("cancel")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}