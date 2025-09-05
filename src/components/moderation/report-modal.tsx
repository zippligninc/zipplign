'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { reportContent, getReportReasonText, type ReportReason, type ContentType } from '@/lib/moderation';
import { AlertTriangle, Loader2 } from 'lucide-react';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  contentType: ContentType;
  contentId: string;
  contentDescription?: string;
}

const reportReasons: ReportReason[] = [
  'spam',
  'harassment',
  'inappropriate_content',
  'fake_account',
  'violence',
  'copyright',
  'other'
];

export function ReportModal({
  isOpen,
  onClose,
  contentType,
  contentId,
  contentDescription
}: ReportModalProps) {
  const [selectedReason, setSelectedReason] = useState<ReportReason>('spam');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedReason) {
      toast({
        title: 'Please select a reason',
        description: 'You must select a reason for reporting this content.',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);

    try {
      const result = await reportContent(
        contentType,
        contentId,
        selectedReason,
        description.trim() || undefined
      );

      if (result.success) {
        toast({
          title: 'Report Submitted',
          description: 'Thank you for your report. We\'ll review it and take appropriate action.',
        });
        handleClose();
      } else {
        toast({
          title: 'Failed to Submit Report',
          description: result.error || 'Something went wrong. Please try again.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error submitting report:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedReason('spam');
    setDescription('');
    setSubmitting(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Report Content
          </DialogTitle>
          <DialogDescription>
            Help us understand what's wrong with this {contentType.replace('_', ' ')}.
            {contentDescription && (
              <span className="block mt-2 text-sm italic">
                "{contentDescription.length > 100 
                  ? contentDescription.substring(0, 100) + '...' 
                  : contentDescription}"
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="text-sm font-medium">Reason for reporting</Label>
            <RadioGroup
              value={selectedReason}
              onValueChange={(value) => setSelectedReason(value as ReportReason)}
              className="mt-2"
            >
              {reportReasons.map((reason) => (
                <div key={reason} className="flex items-center space-x-2">
                  <RadioGroupItem value={reason} id={reason} />
                  <Label htmlFor={reason} className="text-sm cursor-pointer">
                    {getReportReasonText(reason)}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div>
            <Label htmlFor="description" className="text-sm font-medium">
              Additional details (optional)
            </Label>
            <Textarea
              id="description"
              placeholder="Provide more context about why you're reporting this content..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 resize-none"
              rows={3}
              maxLength={500}
            />
            <div className="text-xs text-muted-foreground mt-1">
              {description.length}/500 characters
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="bg-red-600 hover:bg-red-700"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Report'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
