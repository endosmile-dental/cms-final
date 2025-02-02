import dbConnect from "./dbConnect";
import SettingsModel from "@/app/model/Setting.model";

// ✅ Get SuperAdmin Status from DB
export async function getSuperAdminStatus(): Promise<boolean> {
  await dbConnect();
  const setting = await SettingsModel.findOne({ key: "isSuperAdminCreated" });
  return setting ? setting.value : false;
}

// ✅ Set SuperAdmin Status in DB
export async function setSuperAdminStatus(status: boolean): Promise<void> {
  await dbConnect();
  await SettingsModel.updateOne(
    { key: "isSuperAdminCreated" },
    { value: status },
    { upsert: true }
  );
}
