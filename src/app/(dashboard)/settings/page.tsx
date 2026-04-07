'use client';

import React, { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { Upload, X, Loader2 } from 'lucide-react';

export default function SettingsPage() {
  const { settings, fetchSettings, updateSettings, uploadFile } = useStore();
  const [formData, setFormData] = useState(settings);
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchSettings(); }, []);
  useEffect(() => { setFormData(settings); }, [settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateSettings(formData);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch { alert('Gagal menyimpan pengaturan'); }
    setLoading(false);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Pengaturan Bisnis</h2>
        <p className="mt-1 text-sm text-gray-500">Informasi ini akan ditampilkan pada header dan footer invoice.</p>
      </div>
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Nama Bisnis</label>
              <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Alamat Lengkap</label>
              <textarea id="address" rows={3} required value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Nomor Telepon / WhatsApp</label>
              <input type="text" required value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email Bisnis</label>
              <input type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
            </div>
            <div className="sm:col-span-2 border-t border-gray-200 pt-6 mt-2">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Pengaturan Invoice</h3>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Nama Penanda Tangan</label>
              <input type="text" required value={formData.signerName} onChange={(e) => setFormData({ ...formData, signerName: e.target.value })} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Catatan Default (Instruksi Pembayaran)</label>
              <textarea rows={4} value={formData.defaultNotes} onChange={(e) => setFormData({ ...formData, defaultNotes: e.target.value })} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
            </div>
            <div className="sm:col-span-2 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Logo Bisnis</label>
                {formData.logoUrl ? (
                  <div className="mt-1 flex items-center space-x-2">
                    <img src={formData.logoUrl} alt="Logo" className="h-16 w-auto border rounded" />
                    <button type="button" onClick={() => setFormData({ ...formData, logoUrl: '' })} className="text-red-500 hover:text-red-700"><X className="w-4 h-4" /></button>
                  </div>
                ) : (
                  <label className="mt-1 flex items-center justify-center w-full h-20 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 transition-colors">
                    <Upload className="w-5 h-5 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-500">Upload Logo</span>
                    <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) { try { const url = await uploadFile(file, 'logo'); setFormData(prev => ({ ...prev, logoUrl: url })); } catch { alert('Gagal upload logo'); } }
                    }} />
                  </label>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Tanda Tangan</label>
                {formData.signatureUrl ? (
                  <div className="mt-1 flex items-center space-x-2">
                    <img src={formData.signatureUrl} alt="Signature" className="h-16 w-auto border rounded" />
                    <button type="button" onClick={() => setFormData({ ...formData, signatureUrl: '' })} className="text-red-500 hover:text-red-700"><X className="w-4 h-4" /></button>
                  </div>
                ) : (
                  <label className="mt-1 flex items-center justify-center w-full h-20 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 transition-colors">
                    <Upload className="w-5 h-5 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-500">Upload Tanda Tangan</span>
                    <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) { try { const url = await uploadFile(file, 'signature'); setFormData(prev => ({ ...prev, signatureUrl: url })); } catch { alert('Gagal upload tanda tangan'); } }
                    }} />
                  </label>
                )}
              </div>
            </div>
          </div>
          <div className="pt-5 flex items-center justify-end">
            {isSaved && <span className="text-sm text-green-600 mr-4 font-medium">Berhasil disimpan!</span>}
            <button type="submit" disabled={loading} className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50">
              {loading ? 'Menyimpan...' : 'Simpan Pengaturan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
