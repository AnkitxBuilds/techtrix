import React, { useState } from 'react';
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
  Image as ImageIcon,
  CheckCircle2,
  Info
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { FoodCategory, StorageCondition, PackagingType } from '../../types';

const FOOD_PRESET_IMAGES: { label: string; url: string; category: FoodCategory }[] = [
  {
    label: 'Cooked Curry & Rice',
    url: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80',
    category: 'Cooked Meals',
  },
  {
    label: 'Artisanal Bread & Loaves',
    url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80',
    category: 'Bakery & Pastry',
  },
  {
    label: 'Fresh Produce & Vegetables',
    url: 'https://images.unsplash.com/photo-1610348725531-843dff563e2c?auto=format&fit=crop&w=800&q=80',
    category: 'Fresh Produce & Fruits',
  },
  {
    label: 'Biryani & Rice Platters',
    url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80',
    category: 'Cooked Meals',
  },
  {
    label: 'Chilled Yogurt & Fruit',
    url: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=800&q=80',
    category: 'Dairy & Desserts',
  },
];

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

  // Image
  const [selectedImageUrl, setSelectedImageUrl] = useState(FOOD_PRESET_IMAGES[0].url);

  // Errors
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
      imageUrl: selectedImageUrl,
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
          className="text-xs font-semibold text-stone-600 hover:text-stone-900 px-3 py-2 rounded-lg border border-stone-200 hover:bg-stone-50 self-start sm:self-auto"
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
                onChange={(e) => {
                  const cat = e.target.value as FoodCategory;
                  setCategory(cat);
                  // Auto-switch matching preset photo
                  const match = FOOD_PRESET_IMAGES.find((p) => p.category === cat);
                  if (match) setSelectedImageUrl(match.url);
                }}
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

        {/* Section 2: Storage & Food Safety Protocols */}
        <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-stone-100">
            <Thermometer className="w-5 h-5 text-emerald-800" />
            <h2 className="font-bold text-stone-900 text-base">2. Storage, Thermal State & Timings</h2>
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
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
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
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
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

        {/* Section 3: Pickup Location & Contact */}
        <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-stone-100">
            <MapPin className="w-5 h-5 text-emerald-800" />
            <h2 className="font-bold text-stone-900 text-base">3. Pickup Location & Handling Notes</h2>
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

          {/* Photo Preset Selector */}
          <div className="space-y-2 pt-2">
            <label className="block font-semibold text-stone-700 text-xs">
              Select Curated Batch Photo:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {FOOD_PRESET_IMAGES.map((img) => (
                <button
                  key={img.label}
                  type="button"
                  onClick={() => setSelectedImageUrl(img.url)}
                  className={`p-1.5 rounded-xl border text-left transition-all ${
                    selectedImageUrl === img.url
                      ? 'border-emerald-700 ring-2 ring-emerald-600/30 bg-emerald-50'
                      : 'border-stone-200 hover:border-stone-300 bg-white'
                  }`}
                >
                  <img
                    src={img.url}
                    alt={img.label}
                    className="w-full h-16 object-cover rounded-lg mb-1"
                  />
                  <div className="text-[10px] font-semibold text-stone-800 truncate">
                    {img.label}
                  </div>
                </button>
              ))}
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
