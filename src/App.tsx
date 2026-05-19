import { useState, useEffect, ReactNode, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building2, 
  Search, 
  School, 
  MapPin, 
  Info, 
  CheckCircle2, 
  AlertCircle,
  ChevronRight,
  ArrowRight
} from 'lucide-react';

// --- Types & Constants ---

// Replace this with your actual Google Apps Script Web App Deployment URL
const GAS_URL = 'https://script.google.com/macros/s/AKfycbxQBeEDK9sTvILRILufCdSm948onK7oTCc4bVabJnw4Lk0kbSUH4h1-t-yFzoVa4q78Ng/exec';

const PRESET_SCHOOLS = [
  { udise: "9050305302", name: "P.S. BADLI" },
  { udise: "9050306501", name: "P.S. AKANAGAR" },
  { udise: "9050318301", name: "P.S. ALLEHPUR" },
  { udise: "9050300802", name: "P.S. (K) ABBAS NAGAR" },
  { udise: "9050300801", name: "P.S. ABBASNAGAR" },
  { udise: "9050300820", name: "P.S. ABBASPUR" },
  { udise: "9050319101", name: "P.S. AJJUWALA" }
];

interface FormData {
  udise: string;
  schoolName: string;
  isOperated: string; // "है" | "नहीं" | ""
  centerCount?: string;
  distanceCenterCount?: string;
  extraRoom?: string;
  openSpace?: string;
  buildingStatus?: string;
  buildingStatusCount?: string;
  lastUpdated?: string;
}

// --- Components ---

const Label = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <label className={`block text-sm font-medium text-slate-700 mb-2 ${className}`}>
    {children}
  </label>
);

const Select = ({ value, onChange, options, placeholder }: { value: string; onChange: (v: string) => void; options: string[]; placeholder: string }) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-slate-900"
    id={`select-${placeholder.replace(/\s+/g, '-').toLowerCase()}`}
  >
    <option value="">{placeholder}</option>
    {options.map((opt) => (
      <option key={opt} value={opt}>{opt}</option>
    ))}
  </select>
);

export default function App() {
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState<FormData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [isUpdate, setIsUpdate] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const handleSearch = async () => {
    const searchCode = searchTerm.trim();
    if (!searchCode) return;
    
    setIsLoading(true);
    setError('');
    setIsSubmitted(false);
    setIsUpdate(false);
    setAlert(null);

    try {
      // Try fetching from GAS first
      let data = null;
      if (!GAS_URL.includes('YOUR_DEPLOYMENT_ID')) {
        const response = await fetch(`${GAS_URL}?udise=${searchCode}`);
        data = await response.json();
      }

      if (data && !data.error) {
        setFormData({
          udise: data.udise,
          schoolName: data.schoolName,
          isOperated: data.existingData?.isOperated || '',
          centerCount: data.existingData?.centerCount || '',
          distanceCenterCount: data.existingData?.distanceCenterCount || '',
          extraRoom: data.existingData?.extraRoom || '',
          openSpace: data.existingData?.openSpace || '',
          buildingStatus: data.existingData?.buildingStatus || '',
          buildingStatusCount: data.existingData?.buildingStatusCount || '',
          lastUpdated: data.existingData?.lastUpdated || '',
        });
        if (data.existingData) {
          setIsUpdate(true);
        }
      } else {
        // Fallback to local presets
        const localMatch = PRESET_SCHOOLS.find(s => s.udise === searchCode);
        if (localMatch) {
          setFormData({
            udise: localMatch.udise,
            schoolName: localMatch.name,
            isOperated: '',
            centerCount: '',
            distanceCenterCount: '',
            extraRoom: '',
            openSpace: '',
            buildingStatus: '',
            buildingStatusCount: '',
          });
        } else {
          setError('UDISE Code not found. Please check and try again.');
        }
      }
    } catch (err) {
      // Fallback to local if fetch fails
      const localMatch = PRESET_SCHOOLS.find(s => s.udise === searchCode);
      if (localMatch) {
        setFormData({
          udise: localMatch.udise,
          schoolName: localMatch.name,
          isOperated: '',
          centerCount: '',
          distanceCenterCount: '',
          extraRoom: '',
          openSpace: '',
          buildingStatus: '',
          buildingStatusCount: '',
        });
      } else {
        setError('Connection error or school not found.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData) return;

    // Validation
    if (formData.isOperated === 'है') {
      const count = parseInt(formData.centerCount || '0');
      if (isNaN(count) || count <= 0) {
        setAlert({ type: 'error', message: 'कृपया केन्द्रों की सही संख्या दर्ज करें (0 से अधिक)।' });
        return;
      }
    }

    if (formData.isOperated === 'नहीं') {
      const count = parseInt(formData.buildingStatusCount || '0');
      if (formData.buildingStatus && (isNaN(count) || count <= 0)) {
        setAlert({ type: 'error', message: 'कृपया केन्द्रों की सही संख्या दर्ज करें (0 से अधिक)।' });
        return;
      }
    }

    setIsSaving(true);
    setAlert(null);

    try {
      if (GAS_URL.includes('YOUR_DEPLOYMENT_ID')) {
        // Simulate success if URL not set
        setTimeout(() => {
          setIsSubmitted(true);
          setIsSaving(false);
          setAlert({ type: 'success', message: isUpdate ? 'डेटा सफलतापूर्वक अपडेट किया गया!' : 'डेटा सफलतापूर्वक सुरक्षित किया गया!' });
        }, 1000);
        return;
      }

      const response = await fetch(GAS_URL, {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      const result = await response.json();

      if (result.success) {
        setIsSubmitted(true);
        setAlert({ 
          type: 'success', 
          message: result.action === 'updated' ? 'डेटा सफलतापूर्वक अपडेट किया गया!' : 'डेटा सफलतापूर्वक सुरक्षित किया गया!' 
        });
      } else {
        setAlert({ type: 'error', message: 'त्रुटि: ' + result.error });
      }
    } catch (err) {
      setAlert({ type: 'error', message: 'नेटवर्क त्रुटि। कृपया पुनः प्रयास करें।' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-indigo-100">
      {/* Background Accent */}
      <div className="absolute top-0 left-0 w-full h-80 bg-linear-to-b from-indigo-600 to-indigo-800 -z-10" />

      <main className="max-w-3xl mx-auto px-6 py-12">
        {/* Header Section */}
        <header className="text-center mb-10 text-white">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center justify-center p-3 bg-white/10 rounded-2xl backdrop-blur-md mb-6"
          >
            <Building2 className="w-8 h-8 text-indigo-100" />
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-4xl font-bold tracking-tight mb-3"
          >
            Anganwadi Dashboard
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-indigo-100 font-medium opacity-90"
          >
            School-wise Mapping & Infrastructure Status
          </motion.p>
        </header>

        {/* Search Card */}
        <motion.div 
          layout
          className="bg-white rounded-3xl shadow-xl shadow-indigo-900/10 p-2 mb-8"
        >
          <div className="flex items-center gap-2 p-1">
            <div className="relative flex-1">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                type="text" 
                placeholder="Enter UDISE Code (e.g. 9050305302)"
                className="w-full pl-14 pr-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium placeholder:text-slate-400"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                id="udise-input"
              />
            </div>
            <button 
              onClick={handleSearch}
              disabled={isLoading}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white px-8 py-4 rounded-2xl font-semibold shadow-lg shadow-indigo-200 transition-all active:scale-95 flex items-center gap-2"
              id="search-button"
            >
              {isLoading ? 'Searching...' : 'Search'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>

        {/* Error Handling */}
        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-rose-50 border border-rose-100 text-rose-700 px-6 py-4 rounded-2xl flex items-center gap-3 mb-8"
            >
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p className="font-medium text-sm">{error}</p>
            </motion.div>
          )}
          {alert && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`px-6 py-4 rounded-2xl flex items-center gap-3 mb-8 ${
                alert.type === 'success' ? 'bg-emerald-50 border border-emerald-100 text-emerald-700' : 'bg-rose-50 border border-rose-100 text-rose-700'
              }`}
            >
              {alert.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
              <p className="font-bold">{alert.message}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form Card */}
        <AnimatePresence mode="wait">
          {formData && !isSubmitted && (
            <motion.form 
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              onSubmit={handleSubmit}
              className="bg-white rounded-3xl shadow-xl shadow-indigo-900/10 overflow-hidden"
            >
              {/* Card Header (Auto-Populated) */}
              <div className="bg-indigo-50/50 px-8 py-6 border-b border-indigo-100">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-indigo-600 text-xs font-bold uppercase tracking-wider mb-1">
                      <School className="w-4 h-4" />
                      School Details
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800">{formData.schoolName}</h2>
                    <p className="text-slate-500 font-medium flex items-center gap-1 mt-1">
                      <HashIcon /> UDISE: {formData.udise}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Validated
                    </div>
                    {isUpdate && (
                      <div className="flex flex-col items-end gap-1">
                        <div className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-[10px] font-bold uppercase">
                          Existing Record Found
                        </div>
                        {formData.lastUpdated && (
                          <div className="text-[10px] text-slate-400 font-medium whitespace-nowrap">
                            Last: {new Date(formData.lastUpdated).toLocaleDateString('hi-IN')}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Form Content */}
              <div className="p-8 space-y-8">
                {/* 1. Operated Status */}
                <div className="space-y-4">
                  <Label>विद्यालय में आंगनबाड़ी संचालित है अथवा नहीं?</Label>
                  <div className="grid grid-cols-2 gap-4">
                    {['है', 'नहीं'].map((status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => setFormData({ ...formData, isOperated: status })}
                        className={`py-4 px-6 rounded-2xl font-semibold border-2 transition-all flex items-center justify-between ${
                          formData.isOperated === status 
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700' 
                          : 'border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-200'
                        }`}
                        id={`status-${status === 'है' ? 'yes' : 'no'}`}
                      >
                        {status === 'है' ? 'हाँ (Yes)' : 'नहीं (No)'}
                        {formData.isOperated === status && <CheckCircle2 className="w-5 h-5" />}
                      </button>
                    ))}
                  </div>
                </div>

                <AnimatePresence mode="popLayout">
                  {/* Conditional Logic: YES ( संचालित है ) */}
                  {formData.isOperated === 'है' && (
                    <motion.div
                      key="yes-flow"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-6 pt-4 border-t border-slate-100 overflow-hidden"
                    >
                      <div>
                        <Label>यदि आंगनबाड़ी संचालित है तो केन्द्रों की संख्या</Label>
                        <input 
                          type="number"
                          min="1"
                          placeholder="केन्द्रों की संख्या दर्ज करें"
                          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                          value={formData.centerCount || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === '' || parseInt(val) >= 0) {
                              setFormData({ ...formData, centerCount: val });
                            }
                          }}
                          id="center-count"
                          required
                        />
                        {formData.centerCount && parseInt(formData.centerCount) <= 0 && (
                          <p className="text-rose-500 text-xs font-semibold mt-1">संख्या 0 से अधिक होनी चाहिए</p>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {/* Conditional Logic: NO ( संचालित नहीं है ) */}
                  {formData.isOperated === 'नहीं' && (
                    <motion.div
                      key="no-flow"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-6 pt-4 border-t border-slate-100 overflow-hidden"
                    >
                      <div className="bg-amber-50 p-4 rounded-xl flex gap-3 border border-amber-100 mb-6">
                        <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                        <p className="text-xs text-amber-800 leading-relaxed font-medium">
                          चूंकि विद्यालय में आंगनबाड़ी संचालित नहीं है, कृपया निकटतम केन्द्रों एवं भवन की स्थिति की जानकारी दें।
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label>200 मीटर दूरी पर संचालित आंगनबाड़ी केन्द्रों की संख्या (चिन्हांकित आंगनबाड़ी केन्द्र)</Label>
                        <input 
                          type="number"
                          min="0"
                          placeholder="चिन्हांकित केन्द्रों की संख्या"
                          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                          value={formData.distanceCenterCount || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            const nextData = { ...formData, distanceCenterCount: val };
                            if (val === '0') {
                              nextData.buildingStatus = '';
                              nextData.buildingStatusCount = '';
                            }
                            setFormData(nextData);
                          }}
                          id="distance-count"
                        />
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>आंगनबाड़ी केन्द्र संबंधित विद्यालय में न संचालित होने की स्थिति में स्थान की उपलब्धता</Label>
                          <div className="bg-slate-50/50 p-4 rounded-2xl space-y-4 border border-slate-100">
                            <div className="space-y-2">
                              <Label className="text-xs">आंगनबाड़ी केन्द्र हेतु अतिरिक्त कक्ष उपलब्ध है/नहीं</Label>
                              <Select 
                                value={formData.extraRoom || ''}
                                onChange={(v) => {
                                  const nextData = { ...formData, extraRoom: v };
                                  if (v === 'है') nextData.openSpace = '';
                                  setFormData(nextData);
                                }}
                                options={["है", "नहीं"]}
                                placeholder="चुनें"
                              />
                            </div>

                            <AnimatePresence>
                              {formData.extraRoom === 'नहीं' && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                  className="space-y-2 overflow-hidden"
                                >
                                  <Label className="text-xs text-indigo-600 font-bold">आंगनबाड़ी केन्द्र हेतु परिसर में खुले स्थान की उपलब्धता (अतिरिक्त कक्ष निर्माण हेतु)</Label>
                                  <Select 
                                    value={formData.openSpace || ''}
                                    onChange={(v) => setFormData({ ...formData, openSpace: v })}
                                    options={["है", "नहीं"]}
                                    placeholder="चुनें"
                                  />
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                      </div>

                      <AnimatePresence>
                        {formData.distanceCenterCount && parseInt(formData.distanceCenterCount) > 0 && (
                          <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="space-y-4 overflow-hidden"
                          >
                            <div className="space-y-2 pt-4 border-t border-slate-100">
                              <Label>कॉलम 7 में चिन्हांकित किये गये आंगनबाड़ी केन्द्र संचालन भवन की स्थिति</Label>
                              <Select 
                                value={formData.buildingStatus || ''}
                                onChange={(v) => setFormData({ ...formData, buildingStatus: v })}
                                options={[
                                  "स्वयं के भवन में संचालित (आंगनबाड़ी केन्द्र की संख्या)",
                                  "पंचायत भवन/किसी अन्य सरकारी भवन में संचालित (आंगनबाड़ी केन्द्र की संख्या)"
                                ]}
                                placeholder="भवन की स्थिति चुनें"
                              />
                            </div>

                            <AnimatePresence>
                              {formData.buildingStatus && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                  className="space-y-2 overflow-hidden"
                                >
                                  <Label className="text-indigo-600 font-bold">आंगनबाड़ी केन्द्र की संख्या (संख्या 0 से अधिक होनी चाहिए)</Label>
                                  <input 
                                    type="number"
                                    min="1"
                                    placeholder="संख्या दर्ज करें"
                                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                    value={formData.buildingStatusCount || ''}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      if (val === '' || parseInt(val) >= 0) {
                                        setFormData({ ...formData, buildingStatusCount: val });
                                      }
                                    }}
                                    required
                                  />
                                  {formData.buildingStatusCount && parseInt(formData.buildingStatusCount) <= 0 && (
                                    <p className="text-rose-500 text-xs font-semibold mt-1">संख्या 0 से अधिक होनी चाहिए</p>
                                  )}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Submit Footer */}
                {formData.isOperated && (
                  <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }}
                    className="pt-8 flex justify-end"
                  >
                    <button 
                      type="submit"
                      disabled={isSaving}
                      className={`${isUpdate ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-100' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100'} text-white px-10 py-4 rounded-2xl font-bold shadow-xl flex items-center gap-2 group transition-all disabled:opacity-50`}
                      id="submit-form"
                    >
                      {isSaving ? 'प्रतीक्षा करें (Saving...)' : (isUpdate ? 'डेटा अपडेट करें (Update Data)' : 'डेटा जमा करें (Submit Data)')}
                      {!isSaving && <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
                    </button>
                  </motion.div>
                )}
              </div>
            </motion.form>
          )}

          {/* Success State */}
          {isSubmitted && (
            <motion.div 
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-3xl shadow-xl p-12 text-center"
            >
              <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h2 className="text-3xl font-bold text-slate-800 mb-4">{isUpdate ? 'Successfully Updated' : 'Successfully Submitted'}</h2>
              <p className="text-slate-500 font-medium mb-10 max-w-sm mx-auto">
                {isUpdate 
                  ? 'आंगनबाड़ी विवरण सफलतापूर्वक अपडेट कर लिया गया है।' 
                  : 'आंगनबाड़ी विवरण सफलतापूर्वक दर्ज कर लिया गया है।'} आप मुख्य सूची से अन्य विद्यालय भी देख सकते हैं।
              </p>
            </motion.div>
          )}

          {/* Initial State / Empty State */}
          {!formData && !error && !isLoading && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20 px-10 border-2 border-dashed border-indigo-100 rounded-[40px] bg-indigo-50/20"
            >
              <div className="bg-white w-16 h-16 rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-6">
                <MapPin className="w-8 h-8 text-indigo-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Ready to Search</h3>
              <p className="text-slate-500 font-medium max-w-xs mx-auto">
                कृपया विद्यालय का UDISE कोड दर्ज करें और मैपिंग प्रक्रिया शुरू करें।
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer Branding */}
      <footer className="text-center py-10 opacity-50 font-medium text-sm text-slate-400 uppercase tracking-widest">
        Integrated Education Information System
      </footer>
    </div>
  );
}

const HashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="inline mr-0.5">
    <line x1="4" y1="9" x2="20" y2="9"></line>
    <line x1="4" y1="15" x2="20" y2="15"></line>
    <line x1="10" y1="3" x2="8" y2="21"></line>
    <line x1="16" y1="3" x2="14" y2="21"></line>
  </svg>
);

