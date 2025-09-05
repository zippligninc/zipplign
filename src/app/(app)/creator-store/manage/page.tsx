'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, Package, Briefcase, Settings, Eye, EyeOff, Edit, Trash2, Upload } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { ZippLineLogo } from '@/components/common/zippline-logo';

interface Store {
  id: string;
  business_name: string;
  business_type: string;
  description: string;
  is_public: boolean;
  is_store_open: boolean;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url: string;
  stock_quantity: number;
  is_available: boolean;
}

interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url: string;
  duration_minutes: number;
  is_available: boolean;
}

export default function CreatorStoreManagePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  // Form states
  const [showProductForm, setShowProductForm] = useState(false);
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingService, setEditingService] = useState<Service | null>(null);

  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    stock_quantity: '',
    image_url: ''
  });

  const [serviceForm, setServiceForm] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    duration_minutes: '',
    image_url: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setUser(user);

      // Fetch store data
      const { data: storeData } = await supabase
        .from('creator_stores')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (!storeData) {
        router.push('/creator-store/setup');
        return;
      }
      setStore(storeData);

      // Fetch products
      const { data: productsData } = await supabase
        .from('store_products')
        .select('*')
        .eq('store_id', storeData.id)
        .order('created_at', { ascending: false });

      setProducts(productsData || []);

      // Fetch services
      const { data: servicesData } = await supabase
        .from('store_services')
        .select('*')
        .eq('store_id', storeData.id)
        .order('created_at', { ascending: false });

      setServices(servicesData || []);

      // Fetch categories
      const { data: categoriesData } = await supabase
        .from('store_categories')
        .select('*')
        .order('name');

      setCategories(categoriesData || []);
      setLoading(false);
    };

    fetchData();
  }, [router]);

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!store) return;

    setLoading(true);
    try {
      const productData = {
        store_id: store.id,
        name: productForm.name,
        description: productForm.description,
        price: parseFloat(productForm.price),
        category: productForm.category,
        stock_quantity: parseInt(productForm.stock_quantity),
        image_url: productForm.image_url
      };

      if (editingProduct) {
        // Update existing product
        const { error } = await supabase
          .from('store_products')
          .update(productData)
          .eq('id', editingProduct.id);

        if (error) throw error;
        toast({ title: "Product Updated", description: "Product has been updated successfully!" });
      } else {
        // Create new product
        const { error } = await supabase
          .from('store_products')
          .insert(productData);

        if (error) throw error;
        toast({ title: "Product Added", description: "New product has been added to your store!" });
      }

      // Reset form and refresh data
      setProductForm({ name: '', description: '', price: '', category: '', stock_quantity: '', image_url: '' });
      setShowProductForm(false);
      setEditingProduct(null);
      
      // Refresh products
      const { data: productsData } = await supabase
        .from('store_products')
        .select('*')
        .eq('store_id', store.id)
        .order('created_at', { ascending: false });
      setProducts(productsData || []);
    } catch (error: any) {
      console.error('Error saving product:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save product. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleServiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!store) return;

    setLoading(true);
    try {
      const serviceData = {
        store_id: store.id,
        name: serviceForm.name,
        description: serviceForm.description,
        price: parseFloat(serviceForm.price),
        category: serviceForm.category,
        duration_minutes: parseInt(serviceForm.duration_minutes),
        image_url: serviceForm.image_url
      };

      if (editingService) {
        // Update existing service
        const { error } = await supabase
          .from('store_services')
          .update(serviceData)
          .eq('id', editingService.id);

        if (error) throw error;
        toast({ title: "Service Updated", description: "Service has been updated successfully!" });
      } else {
        // Create new service
        const { error } = await supabase
          .from('store_services')
          .insert(serviceData);

        if (error) throw error;
        toast({ title: "Service Added", description: "New service has been added to your store!" });
      }

      // Reset form and refresh data
      setServiceForm({ name: '', description: '', price: '', category: '', duration_minutes: '', image_url: '' });
      setShowServiceForm(false);
      setEditingService(null);
      
      // Refresh services
      const { data: servicesData } = await supabase
        .from('store_services')
        .select('*')
        .eq('store_id', store.id)
        .order('created_at', { ascending: false });
      setServices(servicesData || []);
    } catch (error: any) {
      console.error('Error saving service:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save service. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      const { error } = await supabase
        .from('store_products')
        .delete()
        .eq('id', productId);

      if (error) throw error;
      toast({ title: "Product Deleted", description: "Product has been removed from your store." });
      
      // Refresh products
      const { data: productsData } = await supabase
        .from('store_products')
        .select('*')
        .eq('store_id', store!.id)
        .order('created_at', { ascending: false });
      setProducts(productsData || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to delete product. Please try again.",
        variant: "destructive",
      });
    }
  };

  const deleteService = async (serviceId: string) => {
    if (!confirm('Are you sure you want to delete this service?')) return;

    try {
      const { error } = await supabase
        .from('store_services')
        .delete()
        .eq('id', serviceId);

      if (error) throw error;
      toast({ title: "Service Deleted", description: "Service has been removed from your store." });
      
      // Refresh services
      const { data: servicesData } = await supabase
        .from('store_services')
        .select('*')
        .eq('store_id', store!.id)
        .order('created_at', { ascending: false });
      setServices(servicesData || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to delete service. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <ZippLineLogo className="h-12 w-12 mx-auto mb-4 animate-pulse" />
          <p>Loading your store...</p>
        </div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <ZippLineLogo className="h-12 w-12 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">No Store Found</h2>
          <p className="text-gray-400 mb-4">You need to create a store first.</p>
          <Button onClick={() => router.push('/creator-store/setup')}>
            Create Store
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-black/90 backdrop-blur-sm border-b border-gray-800">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="text-white hover:bg-gray-800"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <ZippLineLogo className="h-6 w-6" />
              <h1 className="text-lg font-semibold">{store.business_name}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={store.is_store_open ? "default" : "secondary"}>
              {store.is_store_open ? "Open" : "Closed"}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/creator-store/setup')}
              className="border-gray-700 text-white hover:bg-gray-800"
            >
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-6">
        {/* Store Status Card */}
        <Card className="bg-gray-900 border-gray-800 mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">{store.business_name}</h2>
                <p className="text-gray-400">{store.description}</p>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-2">
                    {store.is_public ? (
                      <Eye className="h-4 w-4 text-green-400" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    )}
                    <span className="text-sm text-gray-400">
                      {store.is_public ? 'Public' : 'Private'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-teal-400" />
                    <span className="text-sm text-gray-400">
                      {products.length} Products
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-blue-400" />
                    <span className="text-sm text-gray-400">
                      {services.length} Services
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs for Products and Services */}
        <Tabs defaultValue="products" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-gray-900 border-gray-800">
            <TabsTrigger value="products" className="data-[state=active]:bg-teal-600">
              <Package className="h-4 w-4 mr-2" />
              Products ({products.length})
            </TabsTrigger>
            <TabsTrigger value="services" className="data-[state=active]:bg-teal-600">
              <Briefcase className="h-4 w-4 mr-2" />
              Services ({services.length})
            </TabsTrigger>
          </TabsList>

          {/* Products Tab */}
          <TabsContent value="products" className="mt-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Products</h3>
              <Button
                onClick={() => {
                  setShowProductForm(true);
                  setEditingProduct(null);
                  setProductForm({ name: '', description: '', price: '', category: '', stock_quantity: '', image_url: '' });
                }}
                className="bg-teal-600 hover:bg-teal-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            </div>

            {/* Product Form */}
            {showProductForm && (
              <Card className="bg-gray-900 border-gray-800 mb-6">
                <CardHeader>
                  <CardTitle className="text-white">
                    {editingProduct ? 'Edit Product' : 'Add New Product'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleProductSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="product_name" className="text-white">Product Name *</Label>
                        <Input
                          id="product_name"
                          value={productForm.name}
                          onChange={(e) => setProductForm(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Enter product name"
                          className="bg-gray-800 border-gray-700 text-white"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="product_price" className="text-white">Price ($) *</Label>
                        <Input
                          id="product_price"
                          type="number"
                          step="0.01"
                          value={productForm.price}
                          onChange={(e) => setProductForm(prev => ({ ...prev, price: e.target.value }))}
                          placeholder="0.00"
                          className="bg-gray-800 border-gray-700 text-white"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="product_description" className="text-white">Description</Label>
                      <Textarea
                        id="product_description"
                        value={productForm.description}
                        onChange={(e) => setProductForm(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Describe your product..."
                        className="bg-gray-800 border-gray-700 text-white"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="product_category" className="text-white">Category</Label>
                        <Select
                          value={productForm.category}
                          onValueChange={(value) => setProductForm(prev => ({ ...prev, category: value }))}
                        >
                          <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-800 border-gray-700">
                            {categories.map((category) => (
                              <SelectItem key={category.id} value={category.name} className="text-white">
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="product_stock" className="text-white">Stock Quantity</Label>
                        <Input
                          id="product_stock"
                          type="number"
                          value={productForm.stock_quantity}
                          onChange={(e) => setProductForm(prev => ({ ...prev, stock_quantity: e.target.value }))}
                          placeholder="0"
                          className="bg-gray-800 border-gray-700 text-white"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="product_image" className="text-white">Image URL</Label>
                      <Input
                        id="product_image"
                        value={productForm.image_url}
                        onChange={(e) => setProductForm(prev => ({ ...prev, image_url: e.target.value }))}
                        placeholder="https://example.com/image.jpg"
                        className="bg-gray-800 border-gray-700 text-white"
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button type="submit" className="bg-teal-600 hover:bg-teal-700">
                        {editingProduct ? 'Update Product' : 'Add Product'}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setShowProductForm(false);
                          setEditingProduct(null);
                        }}
                        className="border-gray-700 text-white hover:bg-gray-800"
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Products List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((product) => (
                <Card key={product.id} className="bg-gray-900 border-gray-800">
                  <CardContent className="p-4">
                    {product.image_url && (
                      <div className="w-full h-32 bg-gray-800 rounded-lg mb-3 flex items-center justify-center">
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      </div>
                    )}
                    <h4 className="font-semibold text-white mb-1">{product.name}</h4>
                    <p className="text-gray-400 text-sm mb-2 line-clamp-2">{product.description}</p>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-teal-400 font-bold">${product.price}</span>
                      <Badge variant={product.is_available ? "default" : "secondary"}>
                        {product.is_available ? "Available" : "Unavailable"}
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingProduct(product);
                          setProductForm({
                            name: product.name,
                            description: product.description,
                            price: product.price.toString(),
                            category: product.category,
                            stock_quantity: product.stock_quantity.toString(),
                            image_url: product.image_url
                          });
                          setShowProductForm(true);
                        }}
                        className="flex-1 border-gray-700 text-white hover:bg-gray-800"
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteProduct(product.id)}
                        className="border-red-600 text-red-400 hover:bg-red-600/10"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {products.length === 0 && (
              <div className="text-center py-12">
                <Package className="h-12 w-12 mx-auto text-gray-600 mb-4" />
                <h3 className="text-lg font-semibold text-gray-400 mb-2">No Products Yet</h3>
                <p className="text-gray-500 mb-4">Start by adding your first product to your store.</p>
                <Button
                  onClick={() => setShowProductForm(true)}
                  className="bg-teal-600 hover:bg-teal-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Product
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Services Tab */}
          <TabsContent value="services" className="mt-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Services</h3>
              <Button
                onClick={() => {
                  setShowServiceForm(true);
                  setEditingService(null);
                  setServiceForm({ name: '', description: '', price: '', category: '', duration_minutes: '', image_url: '' });
                }}
                className="bg-teal-600 hover:bg-teal-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Service
              </Button>
            </div>

            {/* Service Form */}
            {showServiceForm && (
              <Card className="bg-gray-900 border-gray-800 mb-6">
                <CardHeader>
                  <CardTitle className="text-white">
                    {editingService ? 'Edit Service' : 'Add New Service'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleServiceSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="service_name" className="text-white">Service Name *</Label>
                        <Input
                          id="service_name"
                          value={serviceForm.name}
                          onChange={(e) => setServiceForm(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Enter service name"
                          className="bg-gray-800 border-gray-700 text-white"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="service_price" className="text-white">Price ($) *</Label>
                        <Input
                          id="service_price"
                          type="number"
                          step="0.01"
                          value={serviceForm.price}
                          onChange={(e) => setServiceForm(prev => ({ ...prev, price: e.target.value }))}
                          placeholder="0.00"
                          className="bg-gray-800 border-gray-700 text-white"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="service_description" className="text-white">Description</Label>
                      <Textarea
                        id="service_description"
                        value={serviceForm.description}
                        onChange={(e) => setServiceForm(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Describe your service..."
                        className="bg-gray-800 border-gray-700 text-white"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="service_category" className="text-white">Category</Label>
                        <Select
                          value={serviceForm.category}
                          onValueChange={(value) => setServiceForm(prev => ({ ...prev, category: value }))}
                        >
                          <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-800 border-gray-700">
                            {categories.map((category) => (
                              <SelectItem key={category.id} value={category.name} className="text-white">
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="service_duration" className="text-white">Duration (minutes)</Label>
                        <Input
                          id="service_duration"
                          type="number"
                          value={serviceForm.duration_minutes}
                          onChange={(e) => setServiceForm(prev => ({ ...prev, duration_minutes: e.target.value }))}
                          placeholder="60"
                          className="bg-gray-800 border-gray-700 text-white"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="service_image" className="text-white">Image URL</Label>
                      <Input
                        id="service_image"
                        value={serviceForm.image_url}
                        onChange={(e) => setServiceForm(prev => ({ ...prev, image_url: e.target.value }))}
                        placeholder="https://example.com/image.jpg"
                        className="bg-gray-800 border-gray-700 text-white"
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button type="submit" className="bg-teal-600 hover:bg-teal-700">
                        {editingService ? 'Update Service' : 'Add Service'}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setShowServiceForm(false);
                          setEditingService(null);
                        }}
                        className="border-gray-700 text-white hover:bg-gray-800"
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Services List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {services.map((service) => (
                <Card key={service.id} className="bg-gray-900 border-gray-800">
                  <CardContent className="p-4">
                    {service.image_url && (
                      <div className="w-full h-32 bg-gray-800 rounded-lg mb-3 flex items-center justify-center">
                        <img
                          src={service.image_url}
                          alt={service.name}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      </div>
                    )}
                    <h4 className="font-semibold text-white mb-1">{service.name}</h4>
                    <p className="text-gray-400 text-sm mb-2 line-clamp-2">{service.description}</p>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-teal-400 font-bold">${service.price}</span>
                      <Badge variant={service.is_available ? "default" : "secondary"}>
                        {service.is_available ? "Available" : "Unavailable"}
                      </Badge>
                    </div>
                    {service.duration_minutes && (
                      <p className="text-gray-500 text-xs mb-3">
                        Duration: {service.duration_minutes} minutes
                      </p>
                    )}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingService(service);
                          setServiceForm({
                            name: service.name,
                            description: service.description,
                            price: service.price.toString(),
                            category: service.category,
                            duration_minutes: service.duration_minutes?.toString() || '',
                            image_url: service.image_url
                          });
                          setShowServiceForm(true);
                        }}
                        className="flex-1 border-gray-700 text-white hover:bg-gray-800"
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteService(service.id)}
                        className="border-red-600 text-red-400 hover:bg-red-600/10"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {services.length === 0 && (
              <div className="text-center py-12">
                <Briefcase className="h-12 w-12 mx-auto text-gray-600 mb-4" />
                <h3 className="text-lg font-semibold text-gray-400 mb-2">No Services Yet</h3>
                <p className="text-gray-500 mb-4">Start by adding your first service to your store.</p>
                <Button
                  onClick={() => setShowServiceForm(true)}
                  className="bg-teal-600 hover:bg-teal-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Service
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
