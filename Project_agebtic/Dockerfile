# ใช้ image n8n เป็นตัวตั้งต้น
FROM docker.n8n.io/n8nio/n8n:latest

# สลับไปเป็น user root เพื่อติดตั้งโปรแกรม
USER root

# ติดตั้ง python3 และเครื่องมือที่จำเป็น
RUN apk add --update --no-cache python3 py3-pip

# สลับกลับมาเป็น user node เพื่อความปลอดภัย
USER node