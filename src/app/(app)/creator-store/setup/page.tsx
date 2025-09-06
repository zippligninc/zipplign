'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Store, User, Building, Eye, EyeOff, Upload, Plus, Trash2, Link, Copy } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { LogoMedium } from '@/components/common/logo';
import { useRef } from 'react';

export default function CreatorStoreSetupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [existingStore, setExistingStore] = useState<any>(null);
  const logoFileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [formData, setFormData] = useState({
    business_name: '',
    business_type: 'individual',
    description: '',
    address: '',
    email: '',
    phone_number: '',
    is_public: false,
    is_store_open: false,
    logo_url: '',
    store_link: ''
  });

  // Product state
  const [products, setProducts] = useState([
    {
      id: 1,
      name: '',
      description: '',
      price: '',
      image_url: '',
      category: 'product'
    }
  ]);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setUser(user);

      // Check if user already has a creator store
      const { data: store } = await supabase
        .from('creator_stores')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (store) {
        setExistingStore(store);
        setFormData({
          business_name: store.business_name || '',
          business_type: store.business_type || 'individual',
          description: store.description || '',
          address: store.address || '',
          email: store.email || '',
          phone_number: store.phone_number || '',
          is_public: store.is_public || false,
          is_store_open: store.is_store_open || false
        });
      }
    };

    getUser();
  }, [router]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({ 
        title: 'Invalid file type', 
        description: 'Please select an image file (JPG, PNG, GIF, etc.)', 
        variant: 'destructive' 
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({ 
        title: 'File too large', 
        description: 'Please select an image smaller than 5MB', 
        variant: 'destructive' 
      });
      return;
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `store-logo-${user.id}-${Date.now()}.${fileExt}`;
    const filePath = `store-logos/${user.id}/${fileName}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from('zippclips')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        console.error('Logo upload error:', uploadError);
        toast({ 
          title: 'Error uploading logo', 
          description: uploadError.message, 
          variant: 'destructive' 
        });
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('zippclips')
        .getPublicUrl(filePath);
      
      setFormData(prev => ({ ...prev, logo_url: publicUrl }));
      toast({ 
        title: 'Logo uploaded!', 
        description: 'Your store logo has been updated.' 
      });
    } catch (error: any) {
      console.error('Logo upload error:', error);
      toast({ 
        title: 'Upload failed', 
        description: error.message || 'Failed to upload logo', 
        variant: 'destructive' 
      });
    }
  };

  const addProduct = () => {
    const newProduct = {
      id: Date.now(),
      name: '',
      description: '',
      price: '',
      image_url: '',
      category: 'product'
    };
    setProducts(prev => [...prev, newProduct]);
  };

  const removeProduct = (id: number) => {
    if (products.length > 1) {
      setProducts(prev => prev.filter(product => product.id !== id));
    }
  };

  const updateProduct = (id: number, field: string, value: string) => {
    setProducts(prev => prev.map(product => 
      product.id === id ? { ...product, [field]: value } : product
    ));
  };

  const generateStoreLink = () => {
    if (formData.business_name) {
      const slug = formData.business_name.toLowerCase().replace(/[^a-z0-9]/g, '-');
      const link = `${window.location.origin}/store/${slug}`;
      setFormData(prev => ({ ...prev, store_link: link }));
    }
  };

  const copyStoreLink = () => {
    if (formData.store_link) {
      navigator.clipboard.writeText(formData.store_link);
      toast({
        title: 'Link copied!',
        description: 'Your store link has been copied to clipboard.',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      if (existingStore) {
        // Update existing store
        const { error } = await supabase
          .from('creator_stores')
          .update({
            business_name: formData.business_name,
            business_type: formData.business_type,
            description: formData.description,
            address: formData.address,
            email: formData.email,
            phone_number: formData.phone_number,
            is_public: formData.is_public,
            is_store_open: formData.is_store_open,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id);

        if (error) throw error;

        toast({
          title: "Store Updated",
          description: "Your creator store has been updated successfully!",
        });
      } else {
        // Create new store
        const { error } = await supabase
          .from('creator_stores')
          .insert({
            user_id: user.id,
            business_name: formData.business_name,
            business_type: formData.business_type,
            description: formData.description,
            address: formData.address,
            email: formData.email,
            phone_number: formData.phone_number,
            is_public: formData.is_public,
            is_store_open: formData.is_store_open
          });

        if (error) throw error;

        toast({
          title: "Store Created",
          description: "Your creator store has been created successfully!",
        });
      }

      router.push('/creator-store/manage');
    } catch (error: any) {
      console.error('Error saving store:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save store. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full bg-black text-white overflow-y-auto">
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
              <LogoMedium className="h-6 w-6" />
              <h1 className="text-lg font-semibold">Creator Store Setup</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-xl mx-auto p-4 pb-20">
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-white text-lg">
              <Store className="h-4 w-4" />
              {existingStore ? 'Update Store' : 'Create Store'}
            </CardTitle>
            <p className="text-gray-400 text-xs">
              Set up your creator store to sell products and services.
            </p>
          </CardHeader>
          <CardContent className="pt-0">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Business Name */}
              <div className="space-y-1">
                <Label htmlFor="business_name" className="text-white text-sm">
                  Business Name *
                </Label>
                <Input
                  id="business_name"
                  value={formData.business_name}
                  onChange={(e) => handleInputChange('business_name', e.target.value)}
                  placeholder="Enter your business name or personal name"
                  className="bg-gray-800 border-gray-700 text-white"
                  required
                />
              </div>

              {/* Business Type */}
              <div className="space-y-1">
                <Label className="text-white text-sm">Business Type</Label>
                <Select
                  value={formData.business_type}
                  onValueChange={(value) => handleInputChange('business_type', value)}
                >
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="individual" className="text-white">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Individual Creator
                      </div>
                    </SelectItem>
                    <SelectItem value="business" className="text-white">
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4" />
                        Business
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <Label htmlFor="description" className="text-white text-sm">
                  Store Description
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe what you sell or the services you offer..."
                  className="bg-gray-800 border-gray-700 text-white min-h-[60px]"
                />
              </div>

              {/* Contact Information */}
              <div className="space-y-3">
                <h3 className="text-white font-medium text-sm">Contact Information</h3>
                
                <div className="space-y-1">
                  <Label htmlFor="address" className="text-white text-sm">
                    Address
                  </Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder="Your business address"
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="email" className="text-white text-sm">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="your@email.com"
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="phone_number" className="text-white text-sm">
                    Phone Number
                  </Label>
                  <Input
                    id="phone_number"
                    value={formData.phone_number}
                    onChange={(e) => handleInputChange('phone_number', e.target.value)}
                    placeholder="+1 (555) 123-4567"
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>
              </div>

              {/* Store Logo */}
              <div className="space-y-3">
                <h3 className="text-white font-medium text-sm">Store Logo</h3>
                
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gray-800 rounded-lg flex items-center justify-center overflow-hidden">
                    {formData.logo_url ? (
                      <img 
                        src={formData.logo_url} 
                        alt="Store logo" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Store className="w-8 h-8 text-gray-400" />
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => logoFileInputRef.current?.click()}
                      className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Logo
                    </Button>
                    <p className="text-xs text-gray-400 mt-1">
                      JPG, PNG, GIF up to 5MB
                    </p>
                  </div>
                </div>
                
                <input
                  type="file"
                  ref={logoFileInputRef}
                  onChange={handleLogoUpload}
                  accept="image/*"
                  className="hidden"
                />
              </div>

              {/* Products & Services */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-white font-medium text-sm">Products & Services</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addProduct}
                    className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Product
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {products.map((product, index) => (
                    <div key={product.id} className="bg-gray-800/50 rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-white text-sm font-medium">Product {index + 1}</h4>
                        {products.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeProduct(product.id)}
                            className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          placeholder="Product name"
                          value={product.name}
                          onChange={(e) => updateProduct(product.id, 'name', e.target.value)}
                          className="bg-gray-700 border-gray-600 text-white text-sm"
                        />
                        <Input
                          placeholder="Price (e.g., $29.99)"
                          value={product.price}
                          onChange={(e) => updateProduct(product.id, 'price', e.target.value)}
                          className="bg-gray-700 border-gray-600 text-white text-sm"
                        />
                      </div>
                      
                      <Textarea
                        placeholder="Product description"
                        value={product.description}
                        onChange={(e) => updateProduct(product.id, 'description', e.target.value)}
                        className="bg-gray-700 border-gray-600 text-white text-sm min-h-[60px]"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Store Link */}
              <div className="space-y-3">
                <h3 className="text-white font-medium text-sm">Store Link</h3>
                
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Your store link will appear here"
                      value={formData.store_link}
                      readOnly
                      className="bg-gray-800 border-gray-700 text-white"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={generateStoreLink}
                      disabled={!formData.business_name}
                      className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
                    >
                      <Link className="w-4 h-4 mr-1" />
                      Generate
                    </Button>
                  </div>
                  
                  {formData.store_link && (
                    <div className="flex gap-2">
                      <Input
                        value={formData.store_link}
                        readOnly
                        className="bg-gray-700 border-gray-600 text-white text-sm"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={copyStoreLink}
                        className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                  
                  <p className="text-xs text-gray-400">
                    Share this link to let customers find your store
                  </p>
                </div>
              </div>

              {/* Privacy Settings */}
              <div className="space-y-3">
                <h3 className="text-white font-medium text-sm">Privacy Settings</h3>
                
                <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    {formData.is_public ? (
                      <Eye className="h-5 w-5 text-green-400" />
                    ) : (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    )}
                    <div>
                      <Label className="text-white font-medium text-sm">Public Store</Label>
                      <p className="text-gray-400 text-xs">
                        Only your name/business name will be visible to the public
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={formData.is_public}
                    onCheckedChange={(checked) => handleInputChange('is_public', checked)}
                  />
                </div>
              </div>

              {/* Store Status */}
              <div className="space-y-3">
                <h3 className="text-white font-medium text-sm">Store Status</h3>
                
                <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Store className="h-5 w-5 text-teal-400" />
                    <div>
                      <Label className="text-white font-medium text-sm">Open Creator Store</Label>
                      <p className="text-gray-400 text-xs">
                        Allow customers to purchase your products and services
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={formData.is_store_open}
                    onCheckedChange={(checked) => handleInputChange('is_store_open', checked)}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={loading || !formData.business_name}
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white"
                >
                  {loading ? (
                    'Saving...'
                  ) : existingStore ? (
                    'Update Store'
                  ) : (
                    'Create Store'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
