import React, { useState } from 'react';
import { Calculator, ArrowRightLeft, Info } from 'lucide-react';

type ConversionType = 'athletic' | 'uggs' | 'casual' | 'birkenstock';

export const SizeCalculator: React.FC = () => {
  const [brandType, setBrandType] = useState<ConversionType>('athletic');
  const [inputSize, setInputSize] = useState<string>('7');
  const [inputGender, setInputGender] = useState<'M' | 'W'>('M');

  const calculateResult = () => {
    const size = parseFloat(inputSize);
    if (isNaN(size)) return null;

    if (brandType === 'birkenstock') {
      // EU to US calculation based on image:
      // Women: US = EU - 31 (e.g., 35-31=4)
      // Men: US = EU - 33 (e.g., 40-33=7)
      if (inputGender === 'W') {
        const result = size - 31;
        return result > 0 ? `US Women's ${result}` : 'Invalid Size';
      } else {
        const result = size - 33;
        return result > 0 ? `US Men's ${result}` : 'Invalid Size';
      }
    }

    let diff = 1.5; // Default athletic
    if (brandType === 'uggs') diff = 1;
    if (brandType === 'casual') diff = 2;

    if (inputGender === 'M') {
      const result = size + diff;
      return `Women's ${result}`;
    } else {
      const result = size - diff;
      return `Men's ${result}`;
    }
  };

  const result = calculateResult();

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-3xl shadow-xl border border-slate-100">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-indigo-600 rounded-2xl text-white">
          <Calculator size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Size Converter</h2>
          <p className="text-slate-500 text-sm font-medium">Official Journeys Conversion Ratios</p>
        </div>
      </div>

      <div className="grid gap-8">
        {/* Brand Type Selection */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(['athletic', 'uggs', 'casual', 'birkenstock'] as ConversionType[]).map((type) => (
            <button
              key={type}
              onClick={() => setBrandType(type)}
              className={`
                px-4 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all
                ${brandType === type 
                  ? 'bg-slate-900 text-white shadow-lg scale-105' 
                  : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}
              `}
            >
              {type === 'athletic' && 'Athletic'}
              {type === 'uggs' && 'Uggs/Docs'}
              {type === 'casual' && 'Casual'}
              {type === 'birkenstock' && 'Birk (EU)'}
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-6 bg-slate-50 p-8 rounded-[2.5rem]">
          <div className="flex-1 w-full">
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 ml-1">
              Input Size ({brandType === 'birkenstock' ? 'EU' : 'US'})
            </label>
            <input
              type="number"
              step="0.5"
              value={inputSize}
              onChange={(e) => setInputSize(e.target.value)}
              className="w-full bg-white border-2 border-slate-200 rounded-2xl px-6 py-4 text-2xl font-black text-slate-900 focus:border-indigo-500 outline-none transition-colors"
            />
          </div>

          <div className="flex flex-col items-center">
            <button
              onClick={() => setInputGender(prev => prev === 'M' ? 'W' : 'M')}
              className="p-4 bg-white rounded-full shadow-md hover:shadow-lg transition-all text-indigo-600 border border-slate-100"
            >
              <ArrowRightLeft size={24} />
            </button>
            <span className="text-[10px] font-bold uppercase text-slate-400 mt-2">
              {inputGender === 'M' ? 'Men → Women' : 'Women → Men'}
            </span>
          </div>

          <div className="flex-1 w-full text-center sm:text-left">
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 ml-1">
              Converted Result
            </label>
            <div className="bg-indigo-600 rounded-2xl px-6 py-4 min-h-[72px] flex items-center justify-center sm:justify-start">
              <span className="text-2xl font-black text-white">
                {result || '--'}
              </span>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-amber-50 border border-amber-100 p-6 rounded-2xl flex gap-4">
          <div className="text-amber-600 shrink-0">
            <Info size={20} />
          </div>
          <div className="text-xs text-amber-800 leading-relaxed">
            <p className="font-bold uppercase tracking-wider mb-1">Conversion Rules:</p>
            <ul className="list-disc ml-4 space-y-1 opacity-80">
              <li><strong>Athletic:</strong> 1.5 diff (Adidas, NB, Puma, Asics)</li>
              <li><strong>Uggs/Docs:</strong> 1.0 diff (No half sizes)</li>
              <li><strong>Casual:</strong> 2.0 diff (Crocs, Converse, Birk US)</li>
              <li><strong>Kids:</strong> Big Kids 4-7 is equivalent to Men's 4-7</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
