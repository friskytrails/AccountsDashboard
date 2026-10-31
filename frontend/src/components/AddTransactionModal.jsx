import { useState, useEffect, useRef } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Check,
  X,
  Calendar,
  IndianRupee,
  Image as ImageIcon,
  UploadCloud,
  Trash2,
  FileText,
  Building2,
  Users
} from 'lucide-react';
import toast from 'react-hot-toast';
import { apiFetch } from '../utils/api';
import {
  Modal,
  ModalBackdrop,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Heading,
  Text,
  Button,
  ButtonText,
  ButtonIcon,
  Input,
  InputField,
  InputSlot,
  InputIcon,
  FormControl,
  FormControlLabel,
  FormControlLabelText,
  FormControlHelper,
  FormControlHelperText,
  Select,
  SelectTrigger,
  SelectInput,
  SelectIcon,
  SelectContent,
  SelectItem,
  Box,
  VStack,
  HStack,
  Badge,
  BadgeText
} from '@/components/ui';

const CATEGORIES = [
  { value: 'STAFF_SALARIES', label: 'Staff Salaries' },
  { value: 'MARKETING', label: 'Marketing and Ads' },
  { value: 'OTHERS', label: 'Others' },
  { value: 'GST', label: 'GST' },
];

// Strictly the 6 Treasury Accounts (No Cash, No Other)
const PAYMENT_MODES = [
  { value: 'Kalpana BOI', label: 'Kalpana BOI' },
  { value: 'Kalpana PNB', label: 'Kalpana PNB' },
  { value: 'Babita AU', label: 'Babita AU' },
  { value: 'Hari Mohan BOB', label: 'Hari Mohan BOB' },
  { value: 'FT HDFC', label: 'FT HDFC' },
  { value: 'Pratyush SBI', label: 'Pratyush SBI' },
];

export default function AddTransactionModal({
  isOpen,
  onClose,
  onSuccess,
  selectedMonth = 10,
  selectedYear = 2026,
  initialType = 'OUTFLOW'
}) {
  const [type, setType] = useState(initialType);
  const [flowDirection, setFlowDirection] = useState('COMPANY_TO_SUPPLIER');
  const [category, setCategory] = useState('STAFF_SALARIES');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [paymentMode, setPaymentMode] = useState('Kalpana BOI');
  const [description, setDescription] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [screenshot, setScreenshot] = useState('');
  const [screenshotName, setScreenshotName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setType(initialType || 'OUTFLOW');
      if (initialType === 'INFLOW') {
        setFlowDirection('TRAVELLER_TO_COMPANY');
        setCategory('TRAVELLER_TO_COMPANY');
      } else {
        setFlowDirection('COMPANY_TO_SUPPLIER');
        setCategory('STAFF_SALARIES');
      }
      setScreenshot('');
      setScreenshotName('');
      const today = new Date();
      const currentYear = today.getFullYear();
      const currentMonth = today.getMonth() + 1;

      if (selectedYear === currentYear && selectedMonth === currentMonth) {
        setDate(today.toISOString().split('T')[0]);
      } else {
        const m = String(selectedMonth).padStart(2, '0');
        setDate(`${selectedYear}-${m}-01`);
      }
    }
  }, [isOpen, selectedMonth, selectedYear, initialType]);

  // Sync flowDirection when type toggles
  useEffect(() => {
    if (type === 'INFLOW') {
      if (flowDirection !== 'TRAVELLER_TO_COMPANY' && flowDirection !== 'SUPPLIER_TO_COMPANY') {
        setFlowDirection('TRAVELLER_TO_COMPANY');
      }
      setCategory('TRAVELLER_TO_COMPANY');
    } else {
      if (flowDirection !== 'COMPANY_TO_SUPPLIER' && flowDirection !== 'COMPANY_TO_TRAVELLER') {
        setFlowDirection('COMPANY_TO_SUPPLIER');
      }
      setCategory('STAFF_SALARIES');
    }
  }, [type]);

  // Clipboard paste listener: allows copy-pasting a screenshot in both forms!
  useEffect(() => {
    if (!isOpen) return;

    const handlePaste = (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            e.preventDefault();
            handleProcessImageFile(file);
            toast.success('Screenshot pasted from clipboard!');
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isOpen]);

  const handleProcessImageFile = (file) => {
    if (!file || !file.type.startsWith('image/')) {
      toast.error('Please provide an image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const img = new Image();
      img.onload = () => {
        const maxDim = 1600;
        let width = img.width;
        let height = img.height;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setScreenshot(dataUrl);
        setScreenshotName(file.name || 'clipboard-screenshot.jpg');
      };
      img.src = uploadEvent.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleProcessImageFile(file);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleProcessImageFile(file);
      toast.success('Screenshot attached successfully');
    }
  };

  if (!isOpen) return null;

  async function handleSubmit(e) {
    e.preventDefault();

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error('Please enter a valid positive amount');
      return;
    }

    if (!date) {
      toast.error('Please select a date');
      return;
    }

    setSubmitting(true);
    try {
      const finalCategory =
        type === 'INFLOW'
          ? flowDirection
          : flowDirection === 'COMPANY_TO_TRAVELLER'
            ? 'COMPANY_TO_TRAVELLER'
            : category;

      await apiFetch('/transactions', {
        method: 'POST',
        body: JSON.stringify({
          type,
          flowDirection,
          category: finalCategory,
          amount: parsedAmount,
          date,
          paymentMode,
          description,
          referenceNumber,
          screenshot
        })
      });

      toast.success(
        `${type === 'INFLOW' ? 'Inflow' : 'Expense'} (${
          flowDirection === 'TRAVELLER_TO_COMPANY'
            ? 'Traveller to Company'
            : flowDirection === 'SUPPLIER_TO_COMPANY'
              ? 'Supplier to Company'
              : flowDirection === 'COMPANY_TO_SUPPLIER'
                ? 'Company to Supplier'
                : 'Company to Traveller'
        }) recorded successfully!`
      );
      setAmount('');
      setDescription('');
      setReferenceNumber('');
      setScreenshot('');
      setScreenshotName('');
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to save transaction');
    } finally {
      setSubmitting(false);
    }
  }

  const selectedCategoryObj = CATEGORIES.find((c) => c.value === category);
  const selectedPaymentObj = PAYMENT_MODES.find((m) => m.value === paymentMode);

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalBackdrop onClose={onClose} />
      <ModalContent className="max-w-xl max-h-[92vh] overflow-y-auto border-border/80 bg-card/95 backdrop-blur-2xl shadow-2xl">
        <ModalCloseButton onClose={onClose} />

        <ModalHeader className="mb-3">
          <Heading size="lg" bold className="text-foreground tracking-tight">
            Record Financial Entry
          </Heading>
          <Text size="xs" className="text-muted-foreground">
            Log corporate cash flows across the 6 settlement channels with screenshot receipt proof
          </Text>
        </ModalHeader>

        <form onSubmit={handleSubmit}>
          <ModalBody>
            <VStack space="md">
              {/* Type Toggle Segmented Control: Inflow vs Expense */}
              <Box className="p-1 bg-muted/40 border border-border/50 rounded-xl">
                <HStack space="xs" className="w-full">
                  <Button
                    variant={type === 'INFLOW' ? 'default' : 'ghost'}
                    size="sm"
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                      type === 'INFLOW'
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 font-bold'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                    onClick={() => setType('INFLOW')}
                  >
                    <ButtonIcon as={ArrowDownLeft} />
                    <ButtonText>Inflow (Money Received)</ButtonText>
                  </Button>

                  <Button
                    variant={type === 'OUTFLOW' ? 'destructive' : 'ghost'}
                    size="sm"
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                      type === 'OUTFLOW'
                        ? 'bg-destructive text-destructive-foreground shadow-md shadow-destructive/25 font-bold'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                    onClick={() => setType('OUTFLOW')}
                  >
                    <ButtonIcon as={ArrowUpRight} />
                    <ButtonText>Outflow (Expense / Payout)</ButtonText>
                  </Button>
                </HStack>
              </Box>

              {/* Outflow Direction Classification */}
              {type === 'OUTFLOW' && (
                <Box className="p-3 bg-muted/30 border border-border/60 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono uppercase tracking-wider font-bold text-primary">
                      Flow Classification
                    </span>
                    <Badge variant="error" size="sm">
                      <BadgeText>Outflow Direction</BadgeText>
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFlowDirection('COMPANY_TO_SUPPLIER')}
                      className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                        flowDirection === 'COMPANY_TO_SUPPLIER'
                          ? 'bg-rose-500/15 border-rose-500/60 ring-1 ring-rose-500/40 text-foreground'
                          : 'bg-card/60 border-border/60 text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-bold text-xs text-rose-400">
                        <Building2 className="w-3.5 h-3.5" />
                        <span>Company to Supplier</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">Vendor payout, hotel, transport, fleet</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFlowDirection('COMPANY_TO_TRAVELLER')}
                      className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                        flowDirection === 'COMPANY_TO_TRAVELLER'
                          ? 'bg-rose-500/15 border-rose-500/60 ring-1 ring-rose-500/40 text-foreground'
                          : 'bg-card/60 border-border/60 text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-bold text-xs text-amber-400">
                        <Users className="w-3.5 h-3.5" />
                        <span>Company to Traveller</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">Guest cancellation refund or return</p>
                    </button>
                  </div>
                </Box>
              )}

              {/* Amount and Date Fields */}
              <HStack space="md" className="w-full">
                <Box className="flex-1">
                  <FormControl isRequired>
                    <FormControlLabel>
                      <FormControlLabelText>Amount (₹)</FormControlLabelText>
                    </FormControlLabel>
                    <Input className="bg-muted/30 border-border/70 focus-within:border-primary">
                      <InputSlot>
                        <Text size="xs" bold className="text-muted-foreground font-mono">₹</Text>
                      </InputSlot>
                      <InputField
                        type="number"
                        step="any"
                        required
                        min="1"
                        placeholder="10,000"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="font-mono text-base font-bold text-foreground"
                      />
                    </Input>
                  </FormControl>
                </Box>

                <Box className="flex-1">
                  <FormControl isRequired>
                    <FormControlLabel>
                      <FormControlLabelText>Payment Date</FormControlLabelText>
                    </FormControlLabel>
                    <Input className="bg-muted/30 border-border/70 focus-within:border-primary">
                      <InputField
                        type="date"
                        required
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="text-foreground text-xs"
                      />
                    </Input>
                  </FormControl>
                </Box>
              </HStack>

              {/* Operating Category for Company to Supplier */}
              {type === 'OUTFLOW' && flowDirection === 'COMPANY_TO_SUPPLIER' && (
                <FormControl>
                  <FormControlLabel>
                    <FormControlLabelText>Operating Category</FormControlLabelText>
                  </FormControlLabel>
                  <Select
                    selectedValue={selectedCategoryObj?.label}
                    onValueChange={(val) => setCategory(val)}
                  >
                    <SelectTrigger className="bg-muted/30 border-border/70">
                      <SelectInput placeholder="Select Category" />
                      <SelectIcon />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border/90">
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c.value} value={c.value} label={c.label}>
                          <Text size="xs" className="text-foreground">{c.label}</Text>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
              )}

              {/* Requirement 1: Only the 6 accounts in settlement channel */}
              <FormControl isRequired>
                <FormControlLabel>
                  <FormControlLabelText>Settlement Channel (Account) *</FormControlLabelText>
                </FormControlLabel>
                <Select
                  selectedValue={selectedPaymentObj?.label}
                  onValueChange={(val) => setPaymentMode(val)}
                >
                  <SelectTrigger className="bg-muted/30 border-border/70">
                    <SelectInput placeholder="Select Settlement Account" />
                    <SelectIcon />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border/90">
                    {PAYMENT_MODES.map((m) => (
                      <SelectItem key={m.value} value={m.value} label={m.label}>
                        <Text size="xs" className="text-foreground font-semibold">{m.label}</Text>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>

              {/* Description / Payee / Traveller Note */}
              <FormControl>
                <FormControlLabel>
                  <FormControlLabelText>Description / Payee / Narration</FormControlLabelText>
                </FormControlLabel>
                <Input className="bg-muted/30 border-border/70 focus-within:border-primary">
                  <InputField
                    type="text"
                    placeholder={
                      type === 'INFLOW'
                        ? 'e.g. Manali trip 2nd installment for booking FT1042'
                        : 'e.g. Grand Hotel stay advance for Manali batch'
                    }
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </Input>
              </FormControl>

              {/* Reference / UTR Number */}
              <FormControl>
                <FormControlLabel>
                  <FormControlLabelText>Txn ID / UTR / Reference No. (Optional)</FormControlLabelText>
                </FormControlLabel>
                <Input className="bg-muted/30 border-border/70 focus-within:border-primary">
                  <InputField
                    type="text"
                    placeholder="e.g. UTR19482948204 or IMPS-92048"
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value)}
                    className="font-mono text-xs"
                  />
                </Input>
              </FormControl>

              {/* Requirement 4: Screenshot paste & upload in BOTH forms (Inflow and Expense) */}
              <FormControl>
                <FormControlLabel>
                  <FormControlLabelText>Screenshot / Payment Proof (Copy-Paste or Upload)</FormControlLabelText>
                </FormControlLabel>

                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleFileInputChange}
                  className="hidden"
                />

                {screenshot ? (
                  <div className="relative rounded-xl border border-primary/40 bg-card p-3 flex items-center gap-3.5">
                    <img
                      src={screenshot}
                      alt="Screenshot Preview"
                      className="w-16 h-16 object-cover rounded-lg border border-border shadow-md"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs font-bold text-foreground truncate">
                          {screenshotName || 'Screenshot Attached'}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Ready to save with transaction record. You can press Ctrl+V to replace.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setScreenshot('');
                        setScreenshotName('');
                      }}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer"
                      title="Remove Screenshot"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`rounded-xl border-2 border-dashed p-4 text-center cursor-pointer transition-all ${
                      isDragging
                        ? 'border-primary bg-primary/10'
                        : 'border-border/70 hover:border-primary/50 bg-muted/20 hover:bg-muted/40'
                    }`}
                  >
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                        <UploadCloud className="w-5 h-5" />
                      </div>
                      <div className="text-xs font-semibold text-foreground">
                        <span className="text-primary font-bold">Press Ctrl + V anywhere</span> to paste screenshot
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        or click here / drag & drop screenshot image (PNG, JPG, WEBP)
                      </p>
                    </div>
                  </div>
                )}
              </FormControl>
            </VStack>
          </ModalBody>

          <ModalFooter className="pt-4 border-t border-border/60">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground"
            >
              <ButtonText>Cancel</ButtonText>
            </Button>
            <Button
              variant={type === 'OUTFLOW' ? 'destructive' : 'default'}
              size="sm"
              type="submit"
              isLoading={submitting}
              className={`px-5 shadow-md ${
                type === 'INFLOW' ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/25' : 'shadow-destructive/25'
              }`}
            >
              <ButtonText>Save {type === 'INFLOW' ? 'Inflow' : 'Expense'}</ButtonText>
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}
