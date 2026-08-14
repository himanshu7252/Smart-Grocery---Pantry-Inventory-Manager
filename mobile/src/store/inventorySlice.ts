import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../services/api';

export interface GroceryItem {
  _id: string;
  userId: string;
  name: string;
  category: string;
  brand: string;
  quantity: number;
  unit: string;
  minimumStock: number;
  purchasePrice: number;
  expiryDate: string | null;
  barcode: string;
  location: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

interface InventoryState {
  items: GroceryItem[];
  loading: boolean;
  error: string | null;
}

const initialState: InventoryState = {
  items: [],
  loading: false,
  error: null
};

export const fetchInventory = createAsyncThunk(
  'inventory/fetchAll',
  async (params: { search?: string; category?: string; filter?: string; sort?: string } | undefined, thunkAPI) => {
    try {
      const response = await api.get('/inventory', { params });
      return response.data.data as GroceryItem[];
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to fetch inventory');
    }
  }
);

export const addGrocery = createAsyncThunk(
  'inventory/add',
  async (itemData: Partial<GroceryItem>, thunkAPI) => {
    try {
      const response = await api.post('/inventory', itemData);
      return response.data.data as GroceryItem;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to add item');
    }
  }
);

export const updateGrocery = createAsyncThunk(
  'inventory/update',
  async ({ id, itemData }: { id: string; itemData: Partial<GroceryItem> }, thunkAPI) => {
    try {
      const response = await api.put(`/inventory/${id}`, itemData);
      return response.data.data as GroceryItem;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to update item');
    }
  }
);

export const deleteGrocery = createAsyncThunk(
  'inventory/delete',
  async (id: string, thunkAPI) => {
    try {
      await api.delete(`/inventory/${id}`);
      return id;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to delete item');
    }
  }
);

export const consumeGrocery = createAsyncThunk(
  'inventory/consume',
  async ({ id, amount, reason }: { id: string; amount: number; reason?: string }, thunkAPI) => {
    try {
      const response = await api.post(`/inventory/${id}/consume`, { amount, reason });
      return response.data.data as GroceryItem;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to consume item');
    }
  }
);

export const purchaseGrocery = createAsyncThunk(
  'inventory/purchase',
  async ({ id, amount, price, reason }: { id: string; amount: number; price?: number; reason?: string }, thunkAPI) => {
    try {
      const response = await api.post(`/inventory/${id}/purchase`, { amount, price, reason });
      return response.data.data as GroceryItem;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to restock item');
    }
  }
);

const inventorySlice = createSlice({
  name: 'inventory',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch Inventory
      .addCase(fetchInventory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchInventory.fulfilled, (state, action: PayloadAction<GroceryItem[]>) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchInventory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Add Grocery
      .addCase(addGrocery.fulfilled, (state, action: PayloadAction<GroceryItem>) => {
        state.items.unshift(action.payload);
      })
      // Update Grocery
      .addCase(updateGrocery.fulfilled, (state, action: PayloadAction<GroceryItem>) => {
        const index = state.items.findIndex((item) => item._id === action.payload._id);
        if (index > -1) {
          state.items[index] = action.payload;
        }
      })
      // Delete Grocery
      .addCase(deleteGrocery.fulfilled, (state, action: PayloadAction<string>) => {
        state.items = state.items.filter((item) => item._id !== action.payload);
      })
      // Consume Grocery
      .addCase(consumeGrocery.fulfilled, (state, action: PayloadAction<GroceryItem>) => {
        const index = state.items.findIndex((item) => item._id === action.payload._id);
        if (index > -1) {
          state.items[index] = action.payload;
        }
      })
      // Purchase Grocery
      .addCase(purchaseGrocery.fulfilled, (state, action: PayloadAction<GroceryItem>) => {
        const index = state.items.findIndex((item) => item._id === action.payload._id);
        if (index > -1) {
          state.items[index] = action.payload;
        }
      });
  }
});

export default inventorySlice.reducer;
