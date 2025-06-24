export const generateCode = ()=> {
    const code = String( Math.floor(100000 + Math.random() * 900000)); // 6-digit OTP
    return code
  }