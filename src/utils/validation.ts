// Replace with the correct import or define the type if missing
import { CreateEventData } from "@/types/event";


export const validateEventForm = (formData: CreateEventData): string[] | null => {
  const errors: string[] = [];
  const now = new Date();
  const start = new Date(formData.startAt);
  const end = new Date(formData.endAt);

  // Kiểm tra ngày
  if (start < now) errors.push("Ngày bắt đầu không được nằm trong quá khứ.");
  if (end < now) errors.push("Ngày kết thúc không được nằm trong quá khứ.");
  if (end <= start) errors.push("Ngày kết thúc phải sau ngày bắt đầu.");

  // Kiểm tra các trường bắt buộc
  if (!formData.eventName.trim()) errors.push("Tên sự kiện là bắt buộc.");
  if (!formData.eventDescription.trim()) errors.push("Mô tả sự kiện là bắt buộc.");
  if (formData.categoryIds.length === 0) errors.push("Cần chọn ít nhất một danh mục.");
  if (!formData.eventCoverImageUrl && formData.contents.every(content => !content.imageUrl)) {
    errors.push("Cần tải lên ít nhất một ảnh (ảnh bìa hoặc ảnh nội dung).");
  }

  return errors.length > 0 ? errors : null;
};