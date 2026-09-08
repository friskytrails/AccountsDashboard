import { useState, useEffect } from 'react';
import { ArrowDownLeft, ArrowUpRight, Check, X, Calendar, IndianRupee } from 'lucide-react';
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
  HStack
} from '@/components/ui';

const CATEGORIES = [
  { value: 'HOTELS', label: 'Hotels & Accommodation' },
  { value: 'TRANSPORT', label: 'Transport & Vehicles' },
  { value: 'GUIDES', label: 'Tour Guides' },
  { value: 'SIGHTSEEING', label: 'Sightseeing & Activities' },
  { value: 'SALARIES', label: 'Staff Salaries' },
  { value: 'MARKETING', label: 'Marketing & Ads' },
  { value: 'OTHERS', label: 'Others / Miscellaneous' },
];

const PAYMENT_MODES = [
  { value: 'BANK_TRANSFER', label: 'Bank Transfer (NEFT/IMPS)' },
  { value: 'UPI', label: 'UPI' },
  { value: 'CASH', label: 'Cash' },
  { value: 'CARD', label: 'Credit / Debit Card' },
  { value: 'CHEQUE', label: 'Cheque' },
  { value: 'OTHER', label: 'Other' },
];

export default function AddTransactionModal({
  isOpen,
  onClose,
  onSuccess,
  selectedMonth = 9,
  selectedYear = 2026
}) {
  const [type, setType] = useState('OUTFLOW');
  const [category, setCategory] = useState('HOTELS');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [paymentMode, setPaymentMode] = useState('BANK_TRANSFER');
  const [description, setDescription] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
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
  }, [isOpen, selectedMonth, selectedYear]);

  useEffect(() => {
    if (type === 'INFLOW') {
      setCategory('OTHERS');
    } else if (category === 'OTHERS') {
      setCategory('HOTELS');
    }
  }, [type]);

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
      await apiFetch('/transactions', {
        method: 'POST',
        body: JSON.stringify({
          type,
          category: type === 'INFLOW' ? 'OTHERS' : category,
          amount: parsedAmount,
          date,
          paymentMode,
          description,
          referenceNumber
        })
      });

      toast.success(`${type === 'INFLOW' ? 'Income' : 'Expense'} recorded successfully!`);
      setAmount('');
      setDescription('');
      setReferenceNumber('');
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
      <ModalContent className="max-w-lg border-border/80 bg-card/95 backdrop-blur-2xl shadow-2xl">
        <ModalCloseButton onClose={onClose} />

        <ModalHeader className="mb-4">
          <Heading size="lg" bold className="text-foreground tracking-tight">
            Record Treasury Entry
          </Heading>
          <Text size="xs" className="text-muted-foreground">
            Add operational disbursements or manual income into the cash register
          </Text>
        </ModalHeader>

        <form onSubmit={handleSubmit}>
          <ModalBody>
            <VStack space="md">
              {/* Type Toggle Segmented Control */}
              <Box className="p-1 bg-muted/40 border border-border/50 rounded-xl">
                <HStack space="xs" className="w-full">
                  <Button
                    variant={type === 'OUTFLOW' ? 'destructive' : 'ghost'}
                    size="sm"
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                      type === 'OUTFLOW'
                        ? 'bg-destructive text-destructive-foreground shadow-md shadow-destructive/25'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                    onClick={() => setType('OUTFLOW')}
                  >
                    <ButtonIcon as={ArrowUpRight} />
                    <ButtonText>Expense (Outflow)</ButtonText>
                  </Button>

                  <Button
                    variant={type === 'INFLOW' ? 'default' : 'ghost'}
                    size="sm"
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                      type === 'INFLOW'
                        ? 'bg-primary text-primary-foreground shadow-md shadow-primary/25'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                    onClick={() => setType('INFLOW')}
                  >
                    <ButtonIcon as={ArrowDownLeft} />
                    <ButtonText>Income (Inflow)</ButtonText>
                  </Button>
                </HStack>
              </Box>

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
                      <FormControlLabelText>Transaction Date</FormControlLabelText>
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

              {/* Category */}
              {type === 'OUTFLOW' ? (
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
              ) : (
                <FormControl>
                  <FormControlLabel>
                    <FormControlLabelText>Category</FormControlLabelText>
                  </FormControlLabel>
                  <Input isDisabled className="bg-muted/20 border-border/40">
                    <InputField value="Manual Deposit / Income" disabled />
                  </Input>
                </FormControl>
              )}

              {/* Payment Mode */}
              <FormControl>
                <FormControlLabel>
                  <FormControlLabelText>Payment Mode / Settlement Channel</FormControlLabelText>
                </FormControlLabel>
                <Select
                  selectedValue={selectedPaymentObj?.label}
                  onValueChange={(val) => setPaymentMode(val)}
                >
                  <SelectTrigger className="bg-muted/30 border-border/70">
                    <SelectInput placeholder="Select Payment Mode" />
                    <SelectIcon />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border/90">
                    {PAYMENT_MODES.map((m) => (
                      <SelectItem key={m.value} value={m.value} label={m.label}>
                        <Text size="xs" className="text-foreground">{m.label}</Text>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>

              {/* Description / Payee */}
              <FormControl>
                <FormControlLabel>
                  <FormControlLabelText>Description / Payee Name</FormControlLabelText>
                </FormControlLabel>
                <Input className="bg-muted/30 border-border/70 focus-within:border-primary">
                  <InputField
                    type="text"
                    placeholder="e.g. Grand Hotel stay advance for Manali batch"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </Input>
              </FormControl>

              {/* Reference / UTR Number */}
              <FormControl>
                <FormControlLabel>
                  <FormControlLabelText>Reference / UTR / Invoice No. (Optional)</FormControlLabelText>
                </FormControlLabel>
                <Input className="bg-muted/30 border-border/70 focus-within:border-primary">
                  <InputField
                    type="text"
                    placeholder="e.g. UTR19482948204"
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value)}
                    className="font-mono text-xs"
                  />
                </Input>
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
              className="px-5 shadow-md shadow-primary/20"
            >
              <ButtonText>Save Entry</ButtonText>
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}
