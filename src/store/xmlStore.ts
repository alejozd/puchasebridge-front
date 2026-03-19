import { create } from "zustand";
import type { XMLFile } from "../types/xml";
import { getXMLList, uploadXML } from "../services/xmlService";

interface XMLState {
  xmlList: XMLFile[];
  loading: boolean;
  fetchXMLList: () => Promise<void>;
  uploadXML: (file: File) => Promise<void>;
}

export const useXMLStore = create<XMLState>((set) => ({
  xmlList: [],
  loading: false,

  fetchXMLList: async () => {
    set({ loading: true });
    try {
      const data = await getXMLList();
      set({ xmlList: data, loading: false });
    } catch (error) {
      console.error("Error fetching XML list:", error);
      set({ loading: false });
      throw error;
    }
  },

  uploadXML: async (file: File) => {
    set({ loading: true });
    try {
      await uploadXML(file);
      // Refresh the list after successful upload
      const data = await getXMLList();
      set({ xmlList: data, loading: false });
    } catch (error) {
      console.error("Error uploading XML:", error);
      set({ loading: false });
      throw error;
    }
  },
}));
