import axios from "axios";
import { CreateEventData } from "@/types/event";

export async function createEvent(data: CreateEventData) {
  const token = localStorage.getItem("access_token");
  if (!token) throw new Error("Authentication token not found.");

  const response = await axios.post(
    "https://localhost:7288/api/Event",
    data,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      validateStatus: (status) => status >= 200 && status < 300,
    }
  );

  return response.data || null; // nếu 204 thì response.data là undefined
}

// category
export async function getAllCategories() {
  try {
    const response = await axios.get("https://localhost:7288/api/Category");

    console.log("Category response:", response.data);

    
    const categories = response.data.data;

    if (!Array.isArray(categories)) {
      throw new Error(
        "Expected an array of categories but got: " + JSON.stringify(categories)
      );
    }

    return categories;
  } catch (error) {
    console.error("Failed to fetch categories", error);
    throw error;
  }
}
// upload image

export async function uploadImage(file: File): Promise<string> {
  const token = localStorage.getItem("access_token");

  if (!token) {
    throw new Error("Authentication token not found.");
  }

  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await axios.post(
      "https://localhost:7288/api/Event/upload-image",
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data", // nên thêm để chắc chắn
        },
      }
    );
    return response.data.data;
  } catch (error) {
    console.error("Image upload failed", error);
    throw error;
  }
}
