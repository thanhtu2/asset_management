import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import path from 'path';

let supabaseClient;

const getStorageConfig = () => {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucket = process.env.SUPABASE_STORAGE_BUCKET;

  if (!url || !serviceRoleKey || !bucket) {
    throw new Error('Supabase Storage chưa được cấu hình đầy đủ.');
  }

  if (!supabaseClient) {
    supabaseClient = createClient(url, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
  }

  return { supabase: supabaseClient, bucket };
};

export const uploadRegistrationAttachment = async (file) => {
  if (!file) return null;

  const { supabase, bucket } = getStorageConfig();
  const extension = path.extname(file.originalname).toLowerCase();
  const objectName = `sb-${randomUUID()}${extension}`;
  const { error } = await supabase.storage.from(bucket).upload(objectName, file.buffer, {
    contentType: file.mimetype,
    upsert: false
  });

  if (error) throw error;
  return `/uploads/${objectName}`;
};

export const createRegistrationAttachmentUrl = async (objectName) => {
  const { supabase, bucket } = getStorageConfig();
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(objectName, 60);

  if (error) throw error;
  return data.signedUrl;
};