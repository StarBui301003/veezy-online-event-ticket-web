import { DiscountCodeResponse } from "@/types/Admin/discountCode";
import instance from "../axios.customize";

export async function getDiscountCodes(): Promise<DiscountCodeResponse> {
  const res = await instance.get<DiscountCodeResponse>('/api/DiscountCode');
  return res.data;
}