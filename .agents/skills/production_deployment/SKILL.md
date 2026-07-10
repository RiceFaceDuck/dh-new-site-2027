---
name: production_deployment
description: Use this skill when deploying to production, running deployment scripts, or when asked to make changes to the live system. It contains rules for asking user permission and formatting choices.
---

# Production Auto-Deployment Rule

เมื่อมีการแก้ไขปัญหาบน **ระบบจริง (Production)** หรือปัญหาที่ไม่ได้เกิดจาก Localhost เอเจนต์จะต้อง **ตั้งคำถามแบบช้อยส์ตัวเลือก (Choices)** ผ่านเครื่องมือ `ask_question` เสมอ เพื่อถามความสมัครใจของผู้ใช้ว่าต้องการให้เอเจนต์รันคำสั่ง Deploy ขึ้นระบบจริงทันทีหรือไม่ หากผู้ใช้อยู่อนุญาต ค่อยรันคำสั่ง `Deploy-All.bat` หรือคำสั่ง Deploy ที่เกี่ยวข้อง
- ห้ามรัน Deploy เองโดยพลการเด็ดขาด ต้องรอให้ผู้ใช้เลือกอนุญาตผ่าน Modal ช้อยส์ก่อนเสมอ

## Choice Options Format (การจัดรูปแบบช้อยส์ตัวเลือก)
เมื่อตั้งคำถามแบบช้อยส์ (Choices) เพื่อให้ผู้ใช้ตัดสินใจเลือกแผนงานหรือการพัฒนา ให้เขียนช้อยส์ในรูปแบบ: 
`[ชื่อแผน] | Severity: <อิโมจิสี> Priority: <อิโมจิสี> | <จำนวนไฟล์โดยประมาณ> files | ผลลัพธ์: <ผลลัพธ์แบบสั้นกระชับมากๆ>` เสมอ 
และอธิบายตัวเลือกแบบย่อมากๆ สั้นตรงประเด็นที่สุด
