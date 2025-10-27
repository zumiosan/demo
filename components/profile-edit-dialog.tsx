'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { X, Plus } from 'lucide-react';

type ProfileEditDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: {
    id: string;
    name: string;
    email: string;
    skills: string[];
    industries: string[];
    preferences: any;
  };
  onUpdated: () => void;
};

export function ProfileEditDialog({
  open,
  onOpenChange,
  user,
  onUpdated,
}: ProfileEditDialogProps) {
  const [name, setName] = useState(user.name);
  const [skills, setSkills] = useState<string[]>(user.skills);
  const [industries, setIndustries] = useState<string[]>(user.industries);
  const [newSkill, setNewSkill] = useState('');
  const [newIndustry, setNewIndustry] = useState('');
  const [workStyle, setWorkStyle] = useState(user.preferences?.workStyle || '');
  const [experience, setExperience] = useState(user.preferences?.experience || '');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName(user.name);
      setSkills(user.skills);
      setIndustries(user.industries);
      setWorkStyle(user.preferences?.workStyle || '');
      setExperience(user.preferences?.experience || '');
    }
  }, [open, user]);

  const handleAddSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setSkills(skills.filter((s) => s !== skill));
  };

  const handleAddIndustry = () => {
    if (newIndustry.trim() && !industries.includes(newIndustry.trim())) {
      setIndustries([...industries, newIndustry.trim()]);
      setNewIndustry('');
    }
  };

  const handleRemoveIndustry = (industry: string) => {
    setIndustries(industries.filter((i) => i !== industry));
  };

  const handleSave = async () => {
    setIsSaving(true);

    try {
      const preferences: any = {};
      if (workStyle) preferences.workStyle = workStyle;
      if (experience) preferences.experience = experience;
      // 既存のpreferencesから他のフィールドを保持
      if (user.preferences) {
        Object.keys(user.preferences).forEach((key) => {
          if (key !== 'workStyle' && key !== 'experience') {
            preferences[key] = user.preferences[key];
          }
        });
      }

      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          skills,
          industries,
          preferences,
        }),
      });

      if (response.ok) {
        onUpdated();
        onOpenChange(false);
      } else {
        console.error('Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>プロフィール編集</DialogTitle>
          <DialogDescription>
            あなたのスキルや希望条件を編集できます
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* 名前 */}
          <div className="space-y-2">
            <Label htmlFor="name">名前</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="山田 太郎"
            />
          </div>

          {/* スキル */}
          <div className="space-y-2">
            <Label>スキル</Label>
            <div className="flex gap-2">
              <Input
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSkill();
                  }
                }}
                placeholder="例: React, Python, AWS"
              />
              <Button
                type="button"
                onClick={handleAddSkill}
                variant="outline"
                className="gap-1"
              >
                <Plus className="h-4 w-4" />
                追加
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              {skills.map((skill) => (
                <Badge key={skill} variant="secondary" className="gap-1 pr-1">
                  {skill}
                  <button
                    onClick={() => handleRemoveSkill(skill)}
                    className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          {/* 興味のある業界 */}
          <div className="space-y-2">
            <Label>興味のある業界</Label>
            <div className="flex gap-2">
              <Input
                value={newIndustry}
                onChange={(e) => setNewIndustry(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddIndustry();
                  }
                }}
                placeholder="例: AI, 医療系, 金融"
              />
              <Button
                type="button"
                onClick={handleAddIndustry}
                variant="outline"
                className="gap-1"
              >
                <Plus className="h-4 w-4" />
                追加
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              {industries.map((industry) => (
                <Badge key={industry} variant="outline" className="gap-1 pr-1">
                  {industry}
                  <button
                    onClick={() => handleRemoveIndustry(industry)}
                    className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          {/* 働き方 */}
          <div className="space-y-2">
            <Label htmlFor="workStyle">働き方</Label>
            <Input
              id="workStyle"
              value={workStyle}
              onChange={(e) => setWorkStyle(e.target.value)}
              placeholder="例: フルタイム, リモート可"
            />
          </div>

          {/* 経験年数 */}
          <div className="space-y-2">
            <Label htmlFor="experience">経験年数</Label>
            <Input
              id="experience"
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              placeholder="例: 5年以上"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            キャンセル
          </Button>
          <Button type="button" onClick={handleSave} disabled={isSaving}>
            {isSaving ? '保存中...' : '保存'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
