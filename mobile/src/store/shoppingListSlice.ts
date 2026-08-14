import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../services/api';

export interface ShoppingItem {
  _id: string;
  itemId: string | null;
  name: string;
  quantity: number;
  unit: string;
  completed: boolean;
}

export interface ShoppingListType {
  _id: string;
  userId: string;
  name: string;
  items: ShoppingItem[];
  status: string;
  shared: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ShoppingListState {
  list: ShoppingListType | null;
  loading: boolean;
  error: string | null;
}

const initialState: ShoppingListState = {
  list: null,
  loading: false,
  error: null
};

export const fetchShoppingList = createAsyncThunk(
  'shoppingList/fetch',
  async (_, thunkAPI) => {
    try {
      const response = await api.get('/shopping-lists');
      return response.data.data as ShoppingListType;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to fetch shopping list');
    }
  }
);

export const addShoppingItem = createAsyncThunk(
  'shoppingList/addItem',
  async (itemData: { name: string; quantity: number; unit?: string; itemId?: string | null }, thunkAPI) => {
    try {
      const response = await api.post('/shopping-lists/items', itemData);
      return response.data.data as ShoppingListType;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to add item');
    }
  }
);

export const updateShoppingItem = createAsyncThunk(
  'shoppingList/updateItem',
  async ({ itemId, quantity, completed }: { itemId: string; quantity?: number; completed?: boolean }, thunkAPI) => {
    try {
      const response = await api.put(`/shopping-lists/items/${itemId}`, { quantity, completed });
      return response.data.data as ShoppingListType;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to update item');
    }
  }
);

export const deleteShoppingItem = createAsyncThunk(
  'shoppingList/deleteItem',
  async (itemId: string, thunkAPI) => {
    try {
      const response = await api.delete(`/shopping-lists/items/${itemId}`);
      return response.data.data as ShoppingListType;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to delete item');
    }
  }
);

const shoppingListSlice = createSlice({
  name: 'shoppingList',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch Shopping List
      .addCase(fetchShoppingList.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchShoppingList.fulfilled, (state, action: PayloadAction<ShoppingListType>) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchShoppingList.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Add manual item
      .addCase(addShoppingItem.fulfilled, (state, action: PayloadAction<ShoppingListType>) => {
        state.list = action.payload;
      })
      // Update item
      .addCase(updateShoppingItem.fulfilled, (state, action: PayloadAction<ShoppingListType>) => {
        state.list = action.payload;
      })
      // Delete item
      .addCase(deleteShoppingItem.fulfilled, (state, action: PayloadAction<ShoppingListType>) => {
        state.list = action.payload;
      });
  }
});

export default shoppingListSlice.reducer;
