import { supabase } from './supabase';

export interface StoreProduct {
  id: string;
  store_id: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  category?: string;
  image_url?: string;
  stock_quantity: number;
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

export interface StoreService {
  id: string;
  store_id: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  category?: string;
  image_url?: string;
  duration_minutes?: number;
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreatorStore {
  id: string;
  user_id: string;
  business_name: string;
  business_type: 'individual' | 'business';
  description?: string;
  address?: string;
  email?: string;
  phone_number?: string;
  is_public: boolean;
  is_store_open: boolean;
  created_at: string;
  updated_at: string;
  profiles: {
    username: string;
    full_name: string;
    avatar_url: string;
  };
}

export interface StoreResponse {
  success: boolean;
  data?: any;
  error?: string;
}

/**
 * Get all public creator stores
 */
export async function getPublicStores(limit: number = 20, offset: number = 0): Promise<StoreResponse> {
  try {
    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    const { data, error, count } = await supabase
      .from('creator_stores')
      .select(`
        *,
        profiles!creator_stores_user_id_fkey (
          username,
          full_name,
          avatar_url
        )
      `)
      .eq('is_public', true)
      .eq('is_store_open', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(error.message);
    }

    return {
      success: true,
      data: {
        stores: data || [],
        total: count || 0
      }
    };
  } catch (error: any) {
    console.error('Error fetching public stores:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch stores'
    };
  }
}

/**
 * Get store products
 */
export async function getStoreProducts(storeId: string): Promise<StoreResponse> {
  try {
    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    const { data, error } = await supabase
      .from('store_products')
      .select('*')
      .eq('store_id', storeId)
      .eq('is_available', true)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return {
      success: true,
      data: data || []
    };
  } catch (error: any) {
    console.error('Error fetching store products:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch products'
    };
  }
}

/**
 * Get store services
 */
export async function getStoreServices(storeId: string): Promise<StoreResponse> {
  try {
    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    const { data, error } = await supabase
      .from('store_services')
      .select('*')
      .eq('store_id', storeId)
      .eq('is_available', true)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return {
      success: true,
      data: data || []
    };
  } catch (error: any) {
    console.error('Error fetching store services:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch services'
    };
  }
}

/**
 * Get user's creator store
 */
export async function getUserStore(): Promise<StoreResponse> {
  try {
    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('creator_stores')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(error.message);
    }

    return {
      success: true,
      data: data || null
    };
  } catch (error: any) {
    console.error('Error fetching user store:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch user store'
    };
  }
}

/**
 * Create or update creator store
 */
export async function upsertCreatorStore(storeData: Partial<CreatorStore>): Promise<StoreResponse> {
  try {
    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('creator_stores')
      .upsert({
        user_id: user.id,
        ...storeData
      })
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return {
      success: true,
      data
    };
  } catch (error: any) {
    console.error('Error upserting creator store:', error);
    return {
      success: false,
      error: error.message || 'Failed to save store'
    };
  }
}

/**
 * Add product to store
 */
export async function addStoreProduct(productData: Omit<StoreProduct, 'id' | 'store_id' | 'created_at' | 'updated_at'>): Promise<StoreResponse> {
  try {
    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    // Get user's store
    const { data: store, error: storeError } = await supabase
      .from('creator_stores')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (storeError || !store) {
      throw new Error('Store not found. Please create a store first.');
    }

    const { data, error } = await supabase
      .from('store_products')
      .insert({
        store_id: store.id,
        ...productData
      })
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return {
      success: true,
      data
    };
  } catch (error: any) {
    console.error('Error adding store product:', error);
    return {
      success: false,
      error: error.message || 'Failed to add product'
    };
  }
}

/**
 * Add service to store
 */
export async function addStoreService(serviceData: Omit<StoreService, 'id' | 'store_id' | 'created_at' | 'updated_at'>): Promise<StoreResponse> {
  try {
    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    // Get user's store
    const { data: store, error: storeError } = await supabase
      .from('creator_stores')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (storeError || !store) {
      throw new Error('Store not found. Please create a store first.');
    }

    const { data, error } = await supabase
      .from('store_services')
      .insert({
        store_id: store.id,
        ...serviceData
      })
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return {
      success: true,
      data
    };
  } catch (error: any) {
    console.error('Error adding store service:', error);
    return {
      success: false,
      error: error.message || 'Failed to add service'
    };
  }
}

/**
 * Search stores by category or name
 */
export async function searchStores(query: string, limit: number = 20): Promise<StoreResponse> {
  try {
    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    const { data, error } = await supabase
      .from('creator_stores')
      .select(`
        *,
        profiles!creator_stores_user_id_fkey (
          username,
          full_name,
          avatar_url
        )
      `)
      .eq('is_public', true)
      .eq('is_store_open', true)
      .or(`business_name.ilike.%${query}%,description.ilike.%${query}%`)
      .limit(limit);

    if (error) {
      throw new Error(error.message);
    }

    return {
      success: true,
      data: data || []
    };
  } catch (error: any) {
    console.error('Error searching stores:', error);
    return {
      success: false,
      error: error.message || 'Failed to search stores'
    };
  }
}
