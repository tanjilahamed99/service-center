const Company = require("../../../models/Company");
const ServiceCenter = require("../../../models/ServiceCenter");
const ServiceEngineer = require("../../../models/ServiceEngineer");
const User = require("../../../models/User");
const sendBrevoCampaign = require("../../../utils/brevoEmail");
const bcrypt = require("bcrypt");
const OTP_EXPIRY_MINUTES = 10;
const RESEND_COOLDOWN_MINUTES = 1;
const jwt = require("jsonwebtoken");

exports.changePassword = async (req, res) => {
  let { email, password, code } = req.body;

  if (!email || !password || !code) {
    return res.status(400).json({ status: "error", message: "Invalid input" });
  }

  let user;

  try {
    user = await User.findOne({ email });
  } catch (e) {
    return res
      .status(404)
      .json({ status: "error", email: "error while reading database" });
  }

  if (!user) {
    return res
      .status(404)
      .json({ status: "error", email: "no user matches this email address" });
  }

  await sendBrevoCampaign({
    subject: `${process.env.WEBSITE_NAME} - Password Changed Successfully`,
    senderName: process.env.WEBSITE_NAME,
    senderEmail: process.env.BREVO_EMAIL,
    htmlContent: `
  <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
    <div style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 10px; padding: 30px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
      <h2 style="color: #333;">Hello ${user.name},</h2>
      <p style="font-size: 16px; color: #555;">
        This is a confirmation that your account password was successfully changed.
      </p>

      <p style="font-size: 16px; color: #555;">
        If you made this change, no further action is needed.
      </p>

      <p style="font-size: 16px; color: #555;">
        Thank you for taking steps to keep your account secure.
      </p>

      <p style="font-size: 14px; color: #999; margin-top: 40px;">
        Warm regards,<br/>
        <strong>The ${process.env.WEBSITE_NAME} Team</strong>
      </p>

      <hr style="margin-top: 40px; border: none; border-top: 1px solid #eee;" />
      <p style="font-size: 12px; color: #aaa; text-align: center;">
        © ${new Date().getFullYear()} ${
          process.env.WEBSITE_NAME
        }.in — All rights reserved.
      </p>
    </div>
  </div>
  `,
    to: email,
  });

  await User.findOneAndUpdate(
    { email },
    { $set: { password: await bcrypt.hash(password, 10) } },
  );
  res
    .status(200)
    .json({ success: true, message: "password changed successfully" });
};

exports.checkUser = async (req, res, next) => {
  let { id } = req.body;

  User.findOne({ _id: id })
    .then((user) => res.status(200).json(user))
    .catch(() => res.status(404).json({ error: "User not found" }));
};

// exports.login = async (req, res, next) => {
//   try {
//     const { email, password } = req.body || {};
//     if (!email || !password) {
//       return res
//         .status(400)
//         .send({ status: false, message: "Please provide email and password" });
//     }

//     const user = await User.findOne({ email });

//     if (!user) {
//       return res.status(400).send({ status: false, message: "User not found" });
//     }
//     const passwordMatched = await bcrypt.compare(password || "", user.password);

//     if (!passwordMatched) {
//       return res
//         .status(400)
//         .send({ status: false, message: "incorrect password" });
//     }

//     const payload = {
//       id: user._id,
//       email: user.email,
//       name: user.name,
//       role: user.role,
//     };

//     jwt.sign(
//       payload,
//       process.env.JWT_SECRET,
//       { expiresIn: 60 * 60 * 24 * 60 },
//       (err, token) => {
//         if (err) return res.status(500).json({ token: "Error signing token." });
//         res.status(200).json({ token, user: payload, success: true });
//       },
//     );

//     // use appropriate status code to send data
//   } catch (error) {
//     console.log(error.message);
//     next(error);
//   }
// };

exports.login = async (req, res, next) => {
  try {
    const { email, username, password } = req.body || {};

    const identifier = (email || username || "").trim();

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide username/email and password",
      });
    }

    let user = null;
    let role = null;

    // ==========================================
    // 1. CHECK ADMIN
    // ==========================================

    user = await User.findOne({
      email: identifier.toLowerCase(),
    }).select("+password");

    if (user) {
      role = user.role;
    }

    // ==========================================
    // 2. CHECK COMPANY
    // ==========================================

    if (!user) {
      user = await Company.findOne({
        username: identifier.toLowerCase(),
      }).select("+password");

      if (user) {
        role = "company";
      }
    }

    // ==========================================
    // 3. CHECK SERVICE CENTER
    // ==========================================

    if (!user) {
      user = await ServiceCenter.findOne({
        username: identifier,
      }).select("+password");

      if (user) {
        role = "service-center";
      }
    }

    // ==========================================
    // 4. CHECK SERVICE ENGINEER
    // ==========================================

    if (!user) {
      user = await ServiceEngineer.findOne({
        username: identifier,
      }).select("+password");

      if (user) {
        role = "service-engineer";
      }
    }

    // ==========================================
    // NO USER FOUND
    // ==========================================

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }

    // ==========================================
    // CHECK PASSWORD
    // (moved ahead of the status/subscription checks below — an attacker
    // guessing usernames shouldn't be able to learn whether an account is
    // active or expired without first proving they know the password)
    // ==========================================

    const passwordMatched = await bcrypt.compare(password, user.password);

    if (!passwordMatched) {
      return res.status(400).json({
        success: false,
        message: "Incorrect password",
      });
    }

    // ==========================================
    // CHECK ACCOUNT RESTRICTIONS
    // (inactive for company/service-center/service-engineer;
    // subscription expiry additionally for company)
    // ==========================================

    if (role !== "admin") {
      const isInactive = Boolean(user.status && user.status !== "Active");
      if (isInactive) {
        const reason = "inactive";
        return res.status(303).json({
          success: false,
          restricted: true,
          reason,
          message: "Your account is inactive. Contact your admin for help.",
        });
      }
    }
    if (role === "company") {
      const isSubscriptionExpired =
        role === "company" &&
        Boolean(user.subscriptionPlan?.toDate) &&
        new Date() > new Date(user.subscriptionPlan.toDate);

      if (isSubscriptionExpired) {
        const reason = "subscription_expired";
        return res.status(303).json({
          success: false,
          restricted: true,
          reason,
          message:
            "Your subscription has expired. Contact your admin to renew.",
        });
      }
    }

    // ==========================================
    // CREATE COMMON PAYLOAD
    // ==========================================

    const payload = {
      id: user._id,
      name: user.name || user.companyName,
      role,
    };

    // Admin
    if (role === "admin") {
      payload.email = user.email;
    }

    // Company
    if (role === "company") {
      payload.username = user.username;
    }

    // Service Center
    if (role === "service-center") {
      payload.username = user.username;
      payload.company = user.company;
    }

    // Service Engineer
    if (role === "service-engineer") {
      payload.username = user.username;
      payload.company = user.company;
      payload.serviceCenter = user.serviceCenter;
    }

    // ==========================================
    // CREATE TOKEN
    // ==========================================

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: 60 * 60 * 24 * 60,
    });

    // ==========================================
    // SUCCESS
    // ==========================================

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: payload,
    });
  } catch (error) {
    console.log(error.message);
    next(error);
  }
};
exports.register = async (req, res, next) => {
  const { name, email, password, role } = req.body || {};

  // Basic validation
  if (!name || !email || !password) {
    return res
      .status(400)
      .send({ message: "Please provide all required fields" });
  }

  try {
    // Check for existing email with the same rol
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(201).send({
        success: false,
        message: `user of  ${name} already registered!`,
      });
    }

    const newUser = new User({
      name,
      email,
      password,
      role,
    });
    const savedUser = await newUser.save();

    res.status(201).send({
      success: true,
      message: "User registered successfully!",
      data: savedUser,
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

const buildResetEmail = ({ name, otp, expiryMinutes, websiteName }) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>Password Reset</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:48px 16px;">
  <tr><td align="center">
  <table width="100%" cellpadding="0" cellspacing="0"
    style="max-width:520px;background:#ffffff;border-radius:20px;
           overflow:hidden;box-shadow:0 8px 40px rgba(0,0,0,0.10);">

    <!-- Gradient Header -->
    <tr>
      <td style="background:linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%);padding:40px 40px 32px;text-align:center;">
        <div style="display:inline-block;background:rgba(255,255,255,0.15);
                    border-radius:14px;padding:10px 20px;margin-bottom:20px;">
          <span style="color:#fff;font-size:18px;font-weight:700;
                       font-family:'Segoe UI',sans-serif;letter-spacing:0.5px;">
            🔒 ${websiteName}
          </span>
        </div>
        <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:700;
                   font-family:'Segoe UI',sans-serif;letter-spacing:-0.3px;">
          Password Reset
        </h1>
        <p style="margin:8px 0 0;color:rgba(255,255,255,0.75);font-size:14px;
                  font-family:'Segoe UI',sans-serif;">
          We received a request to reset your password
        </p>
      </td>
    </tr>

    <!-- Body -->
    <tr>
      <td style="padding:36px 40px 0;">
        <p style="margin:0 0 6px;font-size:15px;color:#374151;
                  font-family:'Segoe UI',sans-serif;line-height:1.6;">
          Hi <strong style="color:#111827;">${name}</strong> 👋
        </p>
        <p style="margin:0;font-size:15px;color:#6b7280;
                  font-family:'Segoe UI',sans-serif;line-height:1.7;">
          Use the verification code below to reset your
          <strong style="color:#4f46e5;">${websiteName}</strong> account password.
          Do not share this code with anyone.
        </p>
      </td>
    </tr>

    <!-- OTP Box -->
    <tr>
      <td align="center" style="padding:32px 40px 8px;">
        <p style="margin:0 0 14px;font-size:11px;font-weight:700;color:#9ca3af;
                  letter-spacing:3px;text-transform:uppercase;
                  font-family:'Segoe UI',sans-serif;">
          Verification Code
        </p>
        <table cellpadding="0" cellspacing="0">
          <tr>
            <td style="background:linear-gradient(135deg,#eef2ff,#ede9fe);
                       border:2px solid #a5b4fc;border-radius:16px;
                       padding:20px 52px;text-align:center;">
              <span style="font-size:46px;font-weight:800;letter-spacing:16px;
                           color:#4338ca;font-family:'Courier New',Courier,monospace;">
                ${otp}
              </span>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Timer Badge -->
    <tr>
      <td align="center" style="padding:16px 40px 0;">
        <table cellpadding="0" cellspacing="0">
          <tr>
            <td style="background:#fef9c3;border:1px solid #fde047;
                       border-radius:30px;padding:7px 20px;">
              <span style="font-size:13px;color:#854d0e;font-weight:600;
                           font-family:'Segoe UI',sans-serif;">
                ⏳ &nbsp;Expires in <strong>${expiryMinutes} minutes</strong>
              </span>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Steps -->
    <tr>
      <td style="padding:28px 40px 0;">
        <table width="100%" cellpadding="0" cellspacing="0"
          style="background:#f8fafc;border-radius:12px;padding:0;">
          <tr>
            <td style="padding:20px 24px;">
              <p style="margin:0 0 12px;font-size:12px;font-weight:700;
                        color:#6b7280;letter-spacing:2px;text-transform:uppercase;
                        font-family:'Segoe UI',sans-serif;">
                How to use
              </p>
              <p style="margin:0 0 6px;font-size:13px;color:#374151;
                        font-family:'Segoe UI',sans-serif;line-height:1.6;">
                1️⃣ &nbsp;Go back to the password reset page
              </p>
              <p style="margin:0 0 6px;font-size:13px;color:#374151;
                        font-family:'Segoe UI',sans-serif;line-height:1.6;">
                2️⃣ &nbsp;Enter the 6-digit code above
              </p>
              <p style="margin:0;font-size:13px;color:#374151;
                        font-family:'Segoe UI',sans-serif;line-height:1.6;">
                3️⃣ &nbsp;Set your new password
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Warning -->
    <tr>
      <td style="padding:20px 40px 0;">
        <table width="100%" cellpadding="0" cellspacing="0"
          style="background:#fff1f2;border-left:4px solid #fb7185;
                 border-radius:0 10px 10px 0;">
          <tr>
            <td style="padding:14px 18px;">
              <p style="margin:0;font-size:13px;color:#9f1239;line-height:1.6;
                        font-family:'Segoe UI',sans-serif;">
                🚨 <strong>Didn't request this?</strong> Ignore this email safely.
                Your password will <strong>not</strong> change unless you use this code.
                Contact support if you're concerned.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Divider -->
    <tr>
      <td style="padding:28px 40px 0;">
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:0;"/>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td align="center" style="padding:20px 40px 36px;">
        <p style="margin:0 0 4px;font-size:12px;color:#9ca3af;
                  font-family:'Segoe UI',sans-serif;line-height:1.8;">
          Sent by <strong style="color:#4f46e5;">${websiteName}</strong> &nbsp;·&nbsp;
          Do not reply to this email
        </p>
        <p style="margin:0;font-size:11px;color:#d1d5db;
                  font-family:'Segoe UI',sans-serif;">
          © ${new Date().getFullYear()} ${websiteName}. All rights reserved.
        </p>
      </td>
    </tr>

  </table>
  </td></tr>
</table>
</body>
</html>
`;

exports.sendOtp = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res
      .status(400)
      .json({ success: false, message: "Email is required" });
  }

  let user;
  try {
    user = await User.findOne({ email });
  } catch {
    return res
      .status(500)
      .json({ success: false, message: "Database read error" });
  }

  if (!user) {
    return res
      .status(404)
      .json({ success: false, message: "No user found with this email" });
  }

  /* Resend cooldown */
  if (
    user.otpRequestedAt &&
    Date.now() - user.otpRequestedAt.getTime() <
      RESEND_COOLDOWN_MINUTES * 60 * 1000
  ) {
    return res.status(429).json({
      success: false,
      message: "Please wait before requesting another OTP",
    });
  }

  /* Generate OTP */
  const otp = randomstring.generate({ length: 6, charset: "numeric" });
  const hashedOtp = await bcrypt.hash(otp, 10);
  const otpExpiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  /* Send Email */
  try {
    await sendBrevoCampaign({
      subject: `${process.env.WEBSITE_NAME} - Password Reset Code`,
      senderName: process.env.WEBSITE_NAME,
      senderEmail: process.env.BREVO_EMAIL,
      to: email,
      htmlContent: buildResetEmail({
        name: user.name, // ✅ Fixed: was ${name}
        otp,
        expiryMinutes: OTP_EXPIRY_MINUTES, // ✅ Fixed: was ${otpExpiresAt} (wrong!)
        websiteName: process.env.WEBSITE_NAME,
      }),
    });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to send email" });
  }

  /* Save OTP */
  await User.updateOne(
    { email },
    { $set: { otp: hashedOtp, otpExpiresAt, otpRequestedAt: new Date() } },
  );

  return res
    .status(200)
    .json({ success: true, message: "OTP sent successfully" });
};

exports.verifyCode = async (req, res) => {
  let { email, code } = req.body;

  if (!email) {
    return res.status(400).json({ status: "error", email: "email required" });
  }

  let user;

  try {
    user = await User.findOne({ email });
  } catch (e) {
    return res
      .status(404)
      .json({ status: "error", email: "error while reading database" });
  }

  if (!user) {
    return res
      .status(404)
      .json({ status: "error", email: "no user matches this email address" });
  }

  const isValidOtp = await bcrypt.compare(code, user.otp);

  if (!isValidOtp || user.otpExpiresAt < new Date()) {
    return res
      .status(400)
      .json({ status: "error", message: "Invalid or expired OTP" });
  }

  // Clear OTP after successful verification
  user.otp = null;
  user.otpExpiresAt = null;
  user.otpRequestedAt = null;
  await user.save();

  res.status(200).json({ success: true, message: "otp matched" });
};
