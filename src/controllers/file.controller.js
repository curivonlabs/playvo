import crypto from "crypto";
import supabase from "../config/supabase.js";
import File from "../models/File.js";

export const createFile = async (req, res) => {
  let iconKey;
  let fileKey;

  try {
    const { name, version, packageName, category } = req.body;

    const icon = req.files?.icon?.[0];
    const app = req.files?.app?.[0];

    if (!icon || !app) {
      return res.status(400).json({
        success: false,
        message: "Both icon and application file are required",
        status_code: 400,
      });
    }

    iconKey = `icons/${crypto.randomUUID()}-${icon.originalname}`;
    fileKey = `apps/${crypto.randomUUID()}-${app.originalname}`;

    const { error: iconError } = await supabase.storage
      .from(process.env.SUPABASE_BUCKET_NAME)
      .upload(iconKey, icon.buffer, {
        contentType: icon.mimetype,
        upsert: false
      });

    if (iconError) {
      throw iconError;
    }

    const { error: fileError } = await supabase.storage
      .from(process.env.SUPABASE_BUCKET_NAME)
      .upload(fileKey, app.buffer, {
        contentType: app.mimetype,
        upsert: false
      });

    if (fileError) {
      throw fileError;
    }

    const file = await File.create({
      name,
      version,
      packageName,
      iconKey,
      fileKey,
      size: app.size,
      category
    });

    return res.status(201).json({
      sucess: true,
      message: "File uploaded successfully",
      status_code: 201,
      data: file,
    });
  } catch (error) {
    if (iconKey) {
      await supabase.storage
        .from(process.env.SUPABASE_BUCKET_NAME)
        .remove([iconKey])
        .catch(() => {});
    }

    if (fileKey) {
      await supabase.storage
        .from(process.env.SUPABASE_BUCKET_NAME)
        .remove([fileKey])
        .catch(() => {});
    }

    console.error(error);

    return res.status(500).json({
      sucess: false,
      message: "Failed to upload file",
      status_code: 500,
    });
  }
};

export const getAllApps = async (req, res) => {
  try {
    const apps = await File.find();

    if (apps.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No Apps Found",
        status_code: 404
      });
    }

    return res.status(200).json({
      success: true,
      message: "All Apps Found",
      status_code: 200,
      data: apps
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch apps",
      status_code: 500
    });
  }
};