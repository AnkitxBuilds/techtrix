import React, { useState, useRef, useEffect } from 'react';
import {
  UtensilsCrossed,
  Clock,
  MapPin,
  Thermometer,
  Package,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
  Phone,
  Camera,
  Upload,
  Trash2,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  FileImage,
  X,
  Info
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { FoodCategory, StorageCondition, PackagingType } from '../../types';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_EXTENSIONS = /\.(jpe?g|png|webp)$/i;

export const CreateDonationForm: React.FC = () => {
  const { currentDonor, createDonation, setSmartMatchTargetDonation, setDonorView } = useApp();

  // Form states
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<FoodCategory>('Cooked Meals');
  const [quantity, setQuantity] = useState<number | ''>(25);
  const [unit, setUnit] = useState<'kg' | 'portions' | 'boxes' | 'trays'>('kg');
  const [storageCondition, setStorageCondition] = useState<StorageCondition>('Hot-hold (>60°C)');
  const [packagingType, setPackagingType] = useState<PackagingType>('Sealed Catering Trays');
  const [pickupAddress, setPickupAddress] = useState(currentDonor.address);
  const [pickupArea, setPickupArea] = useState(currentDonor.area);
  const [contactPhone, setContactPhone] = useState(currentDonor.contactPhone);
  const [handlingNotes, setHandlingNotes] = useState(
    'Cooked under strict HACCP hygiene standard. Stored in hot-holding containers immediately after event service.'
  );

  // Time fields
  const [prepTimeOffsetMinutes, setPrepTimeOffsetMinutes] = useState('60'); // 1 hour ago
  const [deadlineOffsetHours, setDeadlineOffsetHours] = useState('3'); // 3 hours from now

  // Allergens & Dietary
  const [selectedAllergens, setSelectedAllergens] = useState<string[]>(['Dairy']);
  const [selectedDietary, setSelectedDietary] = useState<('Pure Veg' | 'Vegan' | 'Non-Veg' | 'Halal' | 'Gluten-Free')[]>([
    'Pure Veg',
  ]);

  // Real Food Image Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Errors & submission
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const ALLERGEN_OPTIONS = ['Dairy', 'Gluten', 'Nuts', 'Eggs', 'Soy', 'Shellfish'];
  const DIETARY_OPTIONS: ('Pure Veg' | 'Vegan' | 'Non-Veg' | 'Halal' | 'Gluten-Free')[] = [
    'Pure Veg',
    'Vegan',
    'Non-Veg',
    'Halal',
    'Gluten-Free',
  ];

  // Clean up Object URL on unmount or when replaced
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const toggleAllergen = (item: string) => {
    setSelectedAllergens((prev) =>
      prev.includes(item) ? prev.filter((a) => a !== item) : [...prev, item]
    );
  };

  const toggleDietary = (item: 'Pure Veg' | 'Vegan' | 'Non-Veg' | 'Halal' | 'Gluten-Free') => {
    setSelectedDietary((prev) =>
      prev.includes(item) ? prev.filter((d) => d !== item) : [...prev, item]
    );
  };

  /**
   * Process and validate a selected or dropped file
   */
  const processSelectedFile = (file: File): boolean => {
    setUploadError(null);

    // 1. Validate file extension and MIME type
    const isValidType =
      ALLOWED_MIME_TYPES.includes(file.type.toLowerCase()) ||
      ALLOWED_EXTENSIONS.test(file.name);

    if (!isValidType) {
      setUploadError('Unsupported file format. Please upload a JPG, JPEG, PNG, or WebP image.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return false;
    }

    // 2. Validate file size (max 5 MB)
    if (file.size > MAX_FILE_SIZE_BYTES) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      setUploadError(`File size exceeds 5 MB limit. Selected file is ${sizeMb} MB. Please choose a smaller image.`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return false;
    }

    // 3. Clean up previous object URL if any
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }

    // 4. Create new local preview URL
    const newPreviewUrl = URL.createObjectURL(file);
    setSelectedFile(file);
    setPreviewUrl(newPreviewUrl);

    // 5. Read as Data URL so the image persists with the listing in this workspace.
    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setDataUrl(event.target.result);
      }
    };
    reader.readAsDataURL(file);

    return true;
  };

  // File input change handler
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processSelectedFile(file);
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      processSelectedFile(file);
    }
  };

  // Remove image handler
  const handleRemoveImage = () => {
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setDataUrl(null);
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Form validation
  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!title.trim()) {
      errs.title = 'Please provide a clear food description or meal name.';
    } else if (title.trim().length < 5) {
      errs.title = 'Title must be at least 5 characters long.';
    }

    if (!quantity || Number(quantity) <= 0) {
      errs.quantity = 'Quantity must be greater than zero.';
    }

    if (!pickupAddress.trim()) {
      errs.pickupAddress = 'Pickup location address is required.';
    }

    if (!contactPhone.trim()) {
      errs.contactPhone = 'Valid contact phone number is required.';
    }

    if (Number(deadlineOffsetHours) <= 0.2) {
      errs.deadline = 'Collection window must be at least 30 minutes in the future.';
    }

    // Safety checks: if cooked meat or dairy is set to ambient, warn donor!
    if (category === 'Cooked Meals' && selectedDietary.includes('Non-Veg') && storageCondition === 'Ambient / Room Temp') {
      errs.storage = 'Cooked meat cannot be safely redistributed at Ambient temperature. Please specify Hot-hold (>60°C) or Refrigerated.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);

    const now = new Date();
    const preparedAt = new Date(now.getTime() - Number(prepTimeOffsetMinutes) * 60 * 1000).toISOString();
    const deadlineAt = new Date(now.getTime() + Number(deadlineOffsetHours) * 3600 * 1000).toISOString();

    // Use uploaded image Data URL or preview URL, or empty string if no image provided
    const finalImageUrl = dataUrl || previewUrl || '';

    const newDonation = createDonation({
      title: title.trim(),
      category,
      quantity: Number(quantity),
      unit,
      preparedAt,
      deadlineAt,
      storageCondition,
      packagingType,
      pickupAddress: pickupAddress.trim(),
      pickupArea: pickupArea.trim() || 'Central Zone',
      donorId: currentDonor.id,
      donorName: currentDonor.name,
      donorType: currentDonor.type,
      contactPhone: contactPhone.trim(),
      handlingNotes: handlingNotes.trim(),
      allergens: selectedAllergens,
      dietaryTags: selectedDietary,
      imageUrl: finalImageUrl,
      safetyStatus: 'eligible',
    });

    setIsSubmitting(false);

    // Prompt user straight into SmartMatch view for this new donation
    setSmartMatchTargetDonation(newDonation);
    setDonorView('smartmatch');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded">
            Donor Portal
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight mt-1">
            Create Food Donation
          </h1>
          <p className="text-xs sm:text-sm text-stone-500">
            Posting on behalf of <strong>{currentDonor.name}</strong> ({currentDonor.type}).
          </p>
        </div>

        <button
          type="button"
          onClick={() => setDonorView('my_donations')}
          className="text-xs font-semibold text-stone-600 hover:text-stone-900 px-3 py-2 rounded-lg border border-stone-200 hover:bg-stone-50 self-start sm:self-auto cursor-pointer"
        >
          Cancel & Return to Listings
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Food Details */}
        <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-stone-100">
            <UtensilsCrossed className="w-5 h-5 text-emerald-800" />
            <h2 className="font-bold text-stone-900 text-base">1. Food Information & Batch Size</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
            {/* Title */}
            <div className="md:col-span-2 space-y-1.5">
              <label className="block font-semibold text-stone-700">
                Food Title / Dish Description <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Surplus Wedding Buffet: Steamed Rice, Dal Makhani & Mixed Veg"
                className={`w-full p-2.5 text-sm rounded-lg border bg-stone-50/50 focus:bg-white focus:outline-hidden focus:ring-2 ${
                  errors.title ? 'border-rose-400 focus:ring-rose-300' : 'border-stone-300 focus:ring-emerald-700'
                }`}
              />
              {errors.title && <p className="text-rose-600 text-[11px]">{errors.title}</p>}
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <label className="block font-semibold text-stone-700">
                Food Category <span className="text-rose-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as FoodCategory)}
                className="w-full p-2.5 text-sm rounded-lg border border-stone-300 bg-stone-50/50 focus:bg-white focus:ring-2 focus:ring-emerald-700"
              >
                <option value="Cooked Meals">Cooked Meals</option>
                <option value="Bakery & Pastry">Bakery & Pastry</option>
                <option value="Fresh Produce & Fruits">Fresh Produce & Fruits</option>
                <option value="Packaged & Dry Goods">Packaged & Dry Goods</option>
                <option value="Dairy & Desserts">Dairy & Desserts</option>
                <option value="Chilled & Frozen">Chilled & Frozen</option>
              </select>
            </div>

            {/* Quantity and Unit */}
            <div className="space-y-1.5">
              <label className="block font-semibold text-stone-700">
                Available Quantity <span className="text-rose-500">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="1"
                  step="0.5"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="25"
                  className={`w-2/3 p-2.5 text-sm rounded-lg border bg-stone-50/50 focus:bg-white focus:ring-2 ${
                    errors.quantity ? 'border-rose-400 focus:ring-rose-300' : 'border-stone-300 focus:ring-emerald-700'
                  }`}
                />
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value as any)}
                  className="w-1/3 p-2.5 text-sm rounded-lg border border-stone-300 bg-stone-50/50 focus:bg-white focus:ring-2 focus:ring-emerald-700"
                >
                  <option value="kg">kg (weight)</option>
                  <option value="portions">portions</option>
                  <option value="boxes">boxes</option>
                  <option value="trays">catering trays</option>
                </select>
              </div>
              {errors.quantity ? (
                <p className="text-rose-600 text-[11px]">{errors.quantity}</p>
              ) : (
                <p className="text-[11px] text-stone-500">
                  Estimated to feed ~{unit === 'portions' ? quantity || 0 : Math.round((Number(quantity) || 0) * 2.4)} individuals.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Section 2: Upload Food Photo (Real Image Upload with Drag & Drop & Preview) */}
        <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <div className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-emerald-800" />
              <h2 className="font-bold text-stone-900 text-base">2. Upload Food Photo</h2>
            </div>
            <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider bg-stone-100 px-2 py-0.5 rounded">
              Optional
            </span>
          </div>

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
            onChange={handleFileInputChange}
            className="hidden"
            aria-label="Upload Food Photo"
          />

          {/* Upload Area: Either Drag-and-Drop Dropzone or Active Preview */}
          {!previewUrl ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-3 ${
                isDragging
                  ? 'border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-500/30 scale-[1.01]'
                  : 'border-stone-300 hover:border-emerald-700 bg-stone-50/50 hover:bg-emerald-50/20'
              }`}
            >
              <div className="w-14 h-14 rounded-2xl bg-emerald-100/70 border border-emerald-200 text-emerald-800 flex items-center justify-center shadow-2xs">
                <Camera className="w-7 h-7" />
              </div>

              <div className="space-y-1 max-w-md">
                <p className="text-sm font-bold text-stone-800">
                  Upload a clear photo of the surplus food you&apos;re donating.
                </p>
                <p className="text-xs text-stone-500">
                  Drag and drop your food photo here, or browse from your device.
                </p>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="px-4 py-2 bg-[#1b4332] hover:bg-emerald-900 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Image</span>
                </button>
              </div>

              <div className="text-[11px] text-stone-400 flex items-center gap-1.5 pt-1">
                <span>Supports JPG, JPEG, PNG, and WebP</span>
                <span>&bull;</span>
                <span>Max 5 MB</span>
              </div>
            </div>
          ) : (
            /* Image Preview State */
            <div className="space-y-3">
              <div className="relative rounded-2xl overflow-hidden border border-stone-200 bg-stone-100 shadow-xs">
                <img
                  src={previewUrl}
                  alt="Donation food preview"
                  className="w-full max-h-72 object-cover"
                />

                {/* Top overlay badge */}
                <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 pointer-events-none">
                  <div className="bg-stone-950/75 backdrop-blur-md text-white text-xs px-3 py-1 rounded-lg flex items-center gap-2 shadow-xs">
                    <FileImage className="w-3.5 h-3.5 text-emerald-300" />
                    <span className="font-semibold truncate max-w-[200px] sm:max-w-xs">
                      {selectedFile?.name || 'Uploaded food photo'}
                    </span>
                    {selectedFile?.size && (
                      <span className="text-stone-300 text-[10px]">
                        ({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)
                      </span>
                    )}
                  </div>

                  <span className="bg-emerald-700/90 backdrop-blur-md text-white text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg shadow-xs flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200" />
                    <span>Attached</span>
                  </span>
                </div>
              </div>

              {/* Actions & Information */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
                <div className="text-xs text-stone-500 flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>
                    Photo ready. Recipient NGOs will see this picture during SmartMatch evaluation.
                  </span>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors flex items-center gap-1.5 border border-stone-300 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Change Image</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors flex items-center gap-1.5 border border-rose-200 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove Image</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Validation Error Banner */}
          {uploadError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-start justify-between gap-2 text-xs animate-in fade-in duration-150">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{uploadError}</span>
              </div>
              <button
                type="button"
                onClick={() => setUploadError(null)}
                className="text-rose-500 hover:text-rose-800 p-0.5"
                aria-label="Dismiss error"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Section 3: Storage & Food Safety Protocols */}
        <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-stone-100">
            <Thermometer className="w-5 h-5 text-emerald-800" />
            <h2 className="font-bold text-stone-900 text-base">3. Storage, Thermal State & Timings</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
            {/* Storage Condition */}
            <div className="space-y-1.5">
              <label className="block font-semibold text-stone-700">
                Thermal Storage Condition <span className="text-rose-500">*</span>
              </label>
              <select
                value={storageCondition}
                onChange={(e) => setStorageCondition(e.target.value as StorageCondition)}
                className="w-full p-2.5 text-sm rounded-lg border border-stone-300 bg-stone-50/50 focus:bg-white focus:ring-2 focus:ring-emerald-700"
              >
                <option value="Hot-hold (>60°C)">Hot-hold (&gt;60°C, Bain-marie / Insulated)</option>
                <option value="Refrigerated (0-4°C)">Refrigerated (0-4°C, Chilled counter)</option>
                <option value="Ambient / Room Temp">Ambient / Room Temp (Dry Bakery, Produce)</option>
                <option value="Frozen (<-18°C)">Frozen (&lt;-18°C)</option>
              </select>
              {errors.storage && <p className="text-rose-600 text-[11px]">{errors.storage}</p>}
            </div>

            {/* Packaging */}
            <div className="space-y-1.5">
              <label className="block font-semibold text-stone-700">
                Packaging Format <span className="text-rose-500">*</span>
              </label>
              <select
                value={packagingType}
                onChange={(e) => setPackagingType(e.target.value as PackagingType)}
                className="w-full p-2.5 text-sm rounded-lg border border-stone-300 bg-stone-50/50 focus:bg-white focus:ring-2 focus:ring-emerald-700"
              >
                <option value="Sealed Catering Trays">Sealed Catering Trays</option>
                <option value="Insulated Thermal Carriers">Insulated Thermal Carriers (Cambro)</option>
                <option value="Individually Boxed">Individually Boxed Meals</option>
                <option value="Clean Stackable Crates">Clean Stackable Crates (Produce/Bread)</option>
                <option value="Bulk Stainless Containers">Bulk Stainless Containers</option>
              </select>
            </div>

            {/* Preparation offset */}
            <div className="space-y-1.5">
              <label className="block font-semibold text-stone-700">
                When was this food prepared?
              </label>
              <select
                value={prepTimeOffsetMinutes}
                onChange={(e) => setPrepTimeOffsetMinutes(e.target.value)}
                className="w-full p-2.5 text-sm rounded-lg border border-stone-300 bg-stone-50/50 focus:bg-white focus:ring-2 focus:ring-emerald-700"
              >
                <option value="30">Just finished (30 minutes ago)</option>
                <option value="60">1 hour ago</option>
                <option value="120">2 hours ago</option>
                <option value="180">3 hours ago</option>
                <option value="360">6 hours ago (Morning shift)</option>
              </select>
            </div>

            {/* Deadline offset */}
            <div className="space-y-1.5">
              <label className="block font-semibold text-stone-700">
                Pickup Window / Safe Expiry Deadline <span className="text-rose-500">*</span>
              </label>
              <select
                value={deadlineOffsetHours}
                onChange={(e) => setDeadlineOffsetHours(e.target.value)}
                className="w-full p-2.5 text-sm rounded-lg border border-stone-300 bg-stone-50/50 focus:bg-white focus:ring-2 focus:ring-emerald-700"
              >
                <option value="1.5">Urgent: Within 1.5 hours</option>
                <option value="2.5">Within 2.5 hours</option>
                <option value="4">Within 4 hours (Standard lunch/dinner)</option>
                <option value="8">Within 8 hours (End of day)</option>
                <option value="24">Within 24 hours (Ambient produce/packaged)</option>
              </select>
              {errors.deadline && <p className="text-rose-600 text-[11px]">{errors.deadline}</p>}
            </div>
          </div>

          {/* Dietary & Allergens */}
          <div className="pt-2 space-y-3">
            <div>
              <label className="block font-semibold text-stone-700 text-xs mb-1.5">
                Dietary Attributes:
              </label>
              <div className="flex flex-wrap gap-2">
                {DIETARY_OPTIONS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleDietary(tag)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      selectedDietary.includes(tag)
                        ? 'bg-emerald-800 text-white shadow-2xs'
                        : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                    }`}
                  >
                    {selectedDietary.includes(tag) ? '✓ ' : ''}{tag}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-semibold text-stone-700 text-xs mb-1.5">
                Allergen Disclosures:
              </label>
              <div className="flex flex-wrap gap-2">
                {ALLERGEN_OPTIONS.map((alg) => (
                  <button
                    key={alg}
                    type="button"
                    onClick={() => toggleAllergen(alg)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      selectedAllergens.includes(alg)
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : 'bg-stone-100 hover:bg-stone-200 text-stone-600'
                    }`}
                  >
                    {selectedAllergens.includes(alg) ? '⚠️ Contains ' : ''}{alg}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: Pickup Location & Contact */}
        <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-stone-100">
            <MapPin className="w-5 h-5 text-emerald-800" />
            <h2 className="font-bold text-stone-900 text-base">4. Pickup Location & Handling Notes</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
            <div className="space-y-1.5">
              <label className="block font-semibold text-stone-700">
                Exact Loading Dock / Door Address <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={pickupAddress}
                onChange={(e) => setPickupAddress(e.target.value)}
                className={`w-full p-2.5 text-sm rounded-lg border bg-stone-50/50 focus:bg-white focus:ring-2 ${
                  errors.pickupAddress ? 'border-rose-400 focus:ring-rose-300' : 'border-stone-300 focus:ring-emerald-700'
                }`}
              />
              {errors.pickupAddress && (
                <p className="text-rose-600 text-[11px]">{errors.pickupAddress}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="block font-semibold text-stone-700">
                Donor Contact Phone <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                className={`w-full p-2.5 text-sm rounded-lg border bg-stone-50/50 focus:bg-white focus:ring-2 ${
                  errors.contactPhone ? 'border-rose-400 focus:ring-rose-300' : 'border-stone-300 focus:ring-emerald-700'
                }`}
              />
              {errors.contactPhone && (
                <p className="text-rose-600 text-[11px]">{errors.contactPhone}</p>
              )}
            </div>

            <div className="md:col-span-2 space-y-1.5">
              <label className="block font-semibold text-stone-700">
                Special Handling / Entry Notes for Recipient Driver
              </label>
              <textarea
                rows={2}
                value={handlingNotes}
                onChange={(e) => setHandlingNotes(e.target.value)}
                placeholder="e.g. Please enter via Gate 2 Service Bay. Ring bell for Kitchen Steward Vikram."
                className="w-full p-2.5 text-sm rounded-lg border border-stone-300 bg-stone-50/50 focus:bg-white focus:ring-2 focus:ring-emerald-700"
              />
            </div>
          </div>
        </div>

        {/* Submit Bar */}
        <div className="bg-stone-50 rounded-2xl p-5 border border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-stone-600">
            <ShieldCheck className="w-4 h-4 text-emerald-800 shrink-0" />
            <span>
              Submission will immediately register in the shared local database and calculate recipient matches.
            </span>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto px-8 py-3 bg-[#1b4332] hover:bg-emerald-900 text-white font-bold text-sm rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-emerald-300" />
            <span>Publish Donation & View SmartMatches</span>
          </button>
        </div>
      </form>
    </div>
  );
};
