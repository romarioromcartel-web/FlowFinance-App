
import React, { useState, useRef } from 'react';
import { Member } from '../types';
import { TRANSLATIONS, Language } from '../data/locales';
import { Users, Plus, Trash2, UserCircle, Mail, AlertTriangle, RefreshCw, Camera, Save, X, Heart } from 'lucide-react';

interface SettingsViewProps {
  members: Member[];
  setMembers: (m: Member[]) => void;
  lang: Language;
  onResetData: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ members, setMembers, lang, onResetData }) => {
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  
  // Profile State (Assuming first member is "Me")
  const currentUser = members[0];
  const [profileName, setProfileName] = useState(currentUser?.name || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const t = TRANSLATIONS[lang];

  // Profile Handlers
  const handleUpdateProfile = () => {
    const updatedMembers = members.map((m, idx) => 
      idx === 0 ? { ...m, name: profileName } : m
    );
    setMembers(updatedMembers);
    alert(t.profile_updated);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        const updatedMembers = members.map((m, idx) => 
          idx === 0 ? { ...m, avatar: base64String } : m
        );
        setMembers(updatedMembers);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveAvatar = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Immediate deletion without confirmation for better UX
    const updatedMembers = members.map((m, idx) => {
      if (idx === 0) {
        // Create a new object without the avatar property explicitly
        const { avatar, ...rest } = m;
        return { ...rest, avatar: undefined };
      }
      return m;
    });
    setMembers(updatedMembers);
    
    // Clear the file input so the same file can be selected again if needed
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Member Handlers
  const handleAddMember = () => {
    if (newMemberName.trim()) {
      const newMember: Member = {
        id: Date.now().toString(),
        name: newMemberName.trim(),
        email: newMemberEmail.trim(),
        role: 'editor'
      };
      setMembers([...members, newMember]);
      if (newMemberEmail.trim()) {
          alert(`${t.invite_sent} ${newMemberEmail}`);
      }
      setNewMemberName('');
      setNewMemberEmail('');
    }
  };

  const handleRemoveMember = (id: string) => {
    if (members.length > 1) {
      setMembers(members.filter(m => m.id !== id));
    }
  };

  const handleReset = () => {
      if (window.confirm(t.reset_confirm)) {
          onResetData();
      }
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-2xl mx-auto pb-20">
      
      {/* Profile Section */}
      <div className="bg-white dark:bg-card p-6 rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-sm">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
             <UserCircle className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">{t.profile}</h2>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="relative group">
            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-indigo-100 dark:border-indigo-900/50 shrink-0 relative">
              {currentUser?.avatar ? (
                <img src={currentUser.avatar} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-400">
                  <UserCircle className="w-12 h-12" />
                </div>
              )}
            </div>
            
            <button 
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 p-2 bg-indigo-600 rounded-full text-white shadow-lg hover:bg-indigo-700 transition-colors z-10"
              title={t.change_avatar}
            >
              <Camera className="w-4 h-4" />
            </button>
            
            {currentUser?.avatar && (
              <button 
                type="button"
                onClick={handleRemoveAvatar}
                className="absolute top-0 right-0 p-1.5 bg-rose-500 rounded-full text-white shadow-lg hover:bg-rose-600 transition-colors transform translate-x-1/4 -translate-y-1/4 z-20 flex items-center justify-center"
                title={t.remove_avatar}
              >
                <X className="w-3 h-3" />
              </button>
            )}

            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleAvatarChange} 
              className="hidden" 
              accept="image/*"
            />
          </div>

          <div className="flex-1 w-full space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">{t.username}</label>
              <input 
                type="text" 
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <button 
              onClick={handleUpdateProfile}
              className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>{t.save}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Support / Donate Section */}
      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-6 rounded-2xl border border-indigo-200 dark:border-indigo-900/30 shadow-sm">
        <div className="flex items-center space-x-3 mb-4">
             <Heart className="w-6 h-6 text-rose-500" />
             <h2 className="text-xl font-bold text-slate-900 dark:text-white">{t.donate_support}</h2>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-300 mb-6">
            {t.donate_desc}
        </p>
        <a 
            href="https://my.moneyfusion.net/6932422bcce144007fbc2721" 
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-bold transition-colors shadow-lg shadow-indigo-500/20"
        >
            <Heart className="w-4 h-4" />
            <span>{t.donate}</span>
        </a>
      </div>

      {/* Members Section */}
      <div className="bg-white dark:bg-card p-6 rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-sm">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
             <Users className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">{t.members}</h2>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input 
              type="text" 
              placeholder={t.member_name}
              value={newMemberName}
              onChange={(e) => setNewMemberName(e.target.value)}
              className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
            />
            <input 
              type="email" 
              placeholder={t.member_email}
              value={newMemberEmail}
              onChange={(e) => setNewMemberEmail(e.target.value)}
              className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          <button 
              onClick={handleAddMember}
              disabled={!newMemberName.trim()}
              className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>{t.add_member}</span>
          </button>

          <div className="space-y-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            {members.map((member, index) => (
              <div key={member.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700">
                <div className="flex items-center space-x-3">
                  {member.avatar ? (
                     <img src={member.avatar} alt={member.name} className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                     <UserCircle className="w-8 h-8 text-slate-400" />
                  )}
                  <div>
                    <p className="font-medium text-slate-800 dark:text-white">{member.name}</p>
                    {member.email && <p className="text-xs text-slate-500 flex items-center"><Mail className="w-3 h-3 mr-1" />{member.email}</p>}
                    {index === 0 && <span className="text-xs text-indigo-500 font-medium">Admin</span>}
                  </div>
                </div>
                {index !== 0 && (
                  <button 
                    onClick={() => handleRemoveMember(member.id)}
                    className="text-rose-400 hover:text-rose-600 p-2 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-rose-50 dark:bg-rose-900/10 p-6 rounded-2xl border border-rose-200 dark:border-rose-900/30 shadow-sm">
        <div className="flex items-center space-x-3 mb-4">
             <AlertTriangle className="w-6 h-6 text-rose-600 dark:text-rose-400" />
             <h2 className="text-xl font-bold text-rose-700 dark:text-rose-400">{t.danger_zone}</h2>
        </div>
        <p className="text-sm text-rose-600 dark:text-rose-300 mb-6">
            {t.reset_confirm}
        </p>
        <button 
            onClick={handleReset}
            className="flex items-center space-x-2 bg-rose-600 hover:bg-rose-700 text-white px-6 py-3 rounded-lg font-bold transition-colors shadow-lg shadow-rose-500/20"
        >
            <RefreshCw className="w-4 h-4" />
            <span>{t.reset_data}</span>
        </button>
      </div>
    </div>
  );
};
