


import React, { useState, useRef, useEffect } from 'react';
import { Member } from '../types';
import { TRANSLATIONS, Language } from '../data/locales';
import { Users, Plus, Trash2, UserCircle, Mail, AlertTriangle, RefreshCw, Camera, Save, X, Heart, CheckCircle, Loader, Crown } from 'lucide-react';

interface SettingsViewProps {
  members: Member[];
  setMembers: (m: Member[]) => void;
  lang: Language;
  onResetData: () => void;
}

// Composant simple de Notification
const Notification: React.FC<{ message: string; type: 'success' | 'error' | 'info' }> = ({ message, type }) => {
  const Icon = type === 'success' ? CheckCircle : type === 'error' ? AlertTriangle : Mail;
  const color = type === 'success' ? 'text-green-600' : type === 'error' ? 'text-red-600' : 'text-blue-600';
  const bgColor = type === 'success' ? 'bg-green-100 dark:bg-green-900/20' : type === 'error' ? 'bg-red-100 dark:bg-red-900/20' : 'bg-blue-100 dark:bg-blue-900/20';

  return (
    <div className={`fixed bottom-4 right-4 p-4 ${bgColor} rounded-xl shadow-2xl flex items-center space-x-3 z-50 transition-transform duration-300 ease-out transform translate-y-0 animate-slide-up`}>
      <Icon className={`w-5 h-5 ${color}`} />
      <span className="text-sm font-medium text-slate-800 dark:text-white">{message}</span>
    </div>
  );
};

export const SettingsView: React.FC<SettingsViewProps> = ({ members, setMembers, lang, onResetData }) => {
  const t = TRANSLATIONS[lang];
  const currentUser = members[0]; // Assume first member is always the primary user

  // 1. Profil State
  const [profileName, setProfileName] = useState(currentUser?.name || '');
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 2. Membres State
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  
  // 3. Notification State
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };
  
  // Synchroniser le nom du profil uniquement si l'utilisateur change de contexte
  useEffect(() => {
    if (currentUser && profileName !== currentUser.name) {
      setProfileName(currentUser.name);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id, currentUser?.name]); // Only update if the user ID or name changes to prevent overwrite during typing


  // --- Profile Handlers ---
  const handleUpdateProfile = () => {
    if (!currentUser || isSaving || !profileName.trim() || profileName.trim() === currentUser.name) return;

    setIsSaving(true);
    setTimeout(() => {
        const updatedMembers = members.map((m, idx) => 
          idx === 0 ? { ...m, name: profileName.trim() } : m
        );
        setMembers(updatedMembers);
        showNotification(t.profile_updated, 'success');
        setIsSaving(false);
    }, 500);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && currentUser) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        const updatedMembers = members.map((m, idx) => 
          idx === 0 ? { ...m, avatar: base64String } : m
        );
        setMembers(updatedMembers);
        showNotification(t.profile_updated, 'success'); // Re-using profile_updated for avatar
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveAvatar = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!currentUser) return;

    const updatedMembers = members.map((m, idx) => {
        if (idx === 0) {
            const newMember = { ...m };
            delete newMember.avatar; 
            return newMember;
        }
        return m;
    });
    setMembers(updatedMembers);
    
    if (fileInputRef.current) fileInputRef.current.value = '';
    showNotification(t.remove_avatar, 'info');
  };

  // --- Member Handlers ---
  const handleAddMember = () => {
    const name = newMemberName.trim();
    const email = newMemberEmail.trim();

    if (name) {
      const newMember: Member = {
        id: Date.now().toString(),
        name: name,
        email: email,
        role: 'editor',
        isAdmin: false, 
        isPremium: false,
      };
      setMembers([...members, newMember]);

      if (email) {
        showNotification(`${t.invite_sent} ${email}`, 'info');
      } else {
        showNotification(`${name} ${t.member_added}`, 'success');
      }
      setNewMemberName('');
      setNewMemberEmail('');
    }
  };

  const handleRemoveMember = (id: string, name: string) => {
    if (members.length > 1) {
      if (window.confirm(t.delete_confirm)) { 
        setMembers(members.filter(m => m.id !== id));
        showNotification(`${name} ${t.member_removed}`, 'error');
      }
    } else {
      showNotification(t.cannot_remove_last_member, 'error');
    }
  };

  const handleReset = () => {
      if (window.confirm(t.reset_confirm)) {
          onResetData();
      }
  };

  if (!currentUser) {
    return (
      <div className="text-center p-8 text-rose-500 dark:text-rose-400">
        <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
        <p>{t.error_loading_profile}</p>
      </div>
    );
  }

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
            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-indigo-100 dark:border-indigo-900/50 shrink-0 relative bg-slate-100 dark:bg-slate-800">
              {currentUser.avatar ? (
                <img src={currentUser.avatar} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400">
                  <UserCircle className="w-12 h-12" />
                </div>
              )}
            </div>
            
            <button 
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 p-2 bg-indigo-600 rounded-full text-white shadow-lg hover:bg-indigo-700 transition-colors z-10 border-2 border-white dark:border-slate-900"
              title={t.change_avatar}
            >
              <Camera className="w-4 h-4" />
            </button>
            
            {currentUser.avatar && (
              <button 
                type="button"
                onClick={handleRemoveAvatar}
                className="absolute top-0 right-0 p-1.5 bg-rose-500 rounded-full text-white shadow-lg hover:bg-rose-600 transition-colors z-20 flex items-center justify-center border-2 border-white dark:border-slate-900 transform translate-x-1/4 -translate-y-1/4"
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
            <div className="flex items-center space-x-2">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{t.premium_status_label}:</span>
                <span className="flex items-center text-xs px-2 py-1 bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-full">
                    <Crown className="w-3 h-3 mr-1" /> {t.is_creator}
                </span>
            </div>
            <button 
              onClick={handleUpdateProfile}
              disabled={isSaving || !profileName.trim() || profileName.trim() === currentUser.name}
              className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{isSaving ? t.save : t.save}</span>
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
                     <img src={member.avatar} alt={member.name} className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-600" />
                   ) : (
                     <UserCircle className="w-8 h-8 text-slate-400" />
                   )}
                  <div>
                    <p className="font-medium text-slate-800 dark:text-white">{member.name}</p>
                    {member.email && <p className="text-xs text-slate-500 flex items-center"><Mail className="w-3 h-3 mr-1" />{member.email}</p>}
                    <span className="flex items-center text-xs text-slate-500 dark:text-slate-400">
                        <UserCircle className="w-3 h-3 mr-1" />
                        <span>{t.member}</span>
                    </span>
                  </div>
                </div>
                {index !== 0 && ( // Admin (first member) cannot remove themselves
                  <button 
                    onClick={() => handleRemoveMember(member.id, member.name)}
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
      
      {notification && <Notification message={notification.message} type={notification.type} />}
    </div>
  );
};