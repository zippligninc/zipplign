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
import { ArrowLeft, Store, User, Building, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { LogoMedium } from '@/components/common/logo';

export default function CreatorStoreSetupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [existingStore, setExistingStore] = useState<any>(null);

  // Form state
  const [formData, setFormData] = useState({
    business_name: '',
    business_type: 'individual',
    description: '',
    address: '',
    email: '',
    phone_number: '',
    is_public: false,
    is_store_open: false
  });

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
              <LogoMedium className="h-6 w-6" />
              <h1 className="text-lg font-semibold">Creator Store Setup</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-6">
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Store className="h-5 w-5" />
              {existingStore ? 'Update Your Store' : 'Create Your Creator Store'}
            </CardTitle>
            <p className="text-gray-400 text-sm">
              Set up your creator store to sell products and services to your followers.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Business Name */}
              <div className="space-y-2">
                <Label htmlFor="business_name" className="text-white">
                  Business Name or Your Name *
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
              <div className="space-y-2">
                <Label className="text-white">Business Type</Label>
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
              <div className="space-y-2">
                <Label htmlFor="description" className="text-white">
                  Store Description
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe what you sell or the services you offer..."
                  className="bg-gray-800 border-gray-700 text-white min-h-[100px]"
                />
              </div>

              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="text-white font-medium">Contact Information</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="address" className="text-white">
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

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white">
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

                <div className="space-y-2">
                  <Label htmlFor="phone_number" className="text-white">
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

              {/* Privacy Settings */}
              <div className="space-y-4">
                <h3 className="text-white font-medium">Privacy Settings</h3>
                
                <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    {formData.is_public ? (
                      <Eye className="h-5 w-5 text-green-400" />
                    ) : (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    )}
                    <div>
                      <Label className="text-white font-medium">Public Store</Label>
                      <p className="text-gray-400 text-sm">
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
              <div className="space-y-4">
                <h3 className="text-white font-medium">Store Status</h3>
                
                <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Store className="h-5 w-5 text-teal-400" />
                    <div>
                      <Label className="text-white font-medium">Open Creator Store</Label>
                      <p className="text-gray-400 text-sm">
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
              <div className="pt-4">
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
