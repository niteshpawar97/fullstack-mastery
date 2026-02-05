# Day 72 Evening: Practice — IAM, Route53, CloudWatch Setup

> **Aaj ka plan:** Ab hum hands-on practice karenge — IAM users/roles banayenge, Route53 se custom domain configure karenge, aur CloudWatch alarms set karenge EC2 monitoring ke liye.

---

## Practice 1: IAM Users Aur Groups Banao

### Step 1 — IAM Group Banao

```
AWS Console → IAM → User Groups → Create Group

Group 1: backend-developers
Attach Policies:
- AmazonS3FullAccess
- AmazonRDSReadOnlyAccess
- AmazonEC2ReadOnlyAccess
- CloudWatchReadOnlyAccess

Group 2: devops-team
Attach Policies:
- AmazonEC2FullAccess
- AmazonS3FullAccess
- AmazonRDSFullAccess
- CloudWatchFullAccess
- IAMReadOnlyAccess
```

### Step 2 — IAM Users Banao

```
IAM → Users → Create User

User 1: rahul-dev
- Console access: Enable
- Add to group: backend-developers

User 2: deploy-bot (CI/CD ke liye)
- Console access: Disable
- Programmatic access: Enable (access key)
- Add to group: devops-team (ya custom limited policy)
```

### Step 3 — Custom Policy Banao (CI/CD Bot Ke Liye)

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "AllowEC2Deploy",
            "Effect": "Allow",
            "Action": [
                "ec2:DescribeInstances",
                "ec2:StartInstances",
                "ec2:StopInstances"
            ],
            "Resource": "arn:aws:ec2:ap-south-1:123456789:instance/i-0abc123def"
        },
        {
            "Sid": "AllowS3Deploy",
            "Effect": "Allow",
            "Action": [
                "s3:PutObject",
                "s3:GetObject",
                "s3:ListBucket"
            ],
            "Resource": [
                "arn:aws:s3:::kisan-app-uploads",
                "arn:aws:s3:::kisan-app-uploads/*"
            ]
        },
        {
            "Sid": "AllowCloudWatchLogs",
            "Effect": "Allow",
            "Action": [
                "logs:CreateLogGroup",
                "logs:CreateLogStream",
                "logs:PutLogEvents"
            ],
            "Resource": "arn:aws:logs:ap-south-1:123456789:*"
        }
    ]
}
```

```
IAM → Policies → Create Policy → JSON tab → Paste above JSON
Policy name: cicd-deploy-policy
Attach to user: deploy-bot
```

> **Yaad Rakho:** CI/CD bot ko sirf deploy ke liye zaroori permissions do. Full admin access dena = security risk!

---

## Practice 2: IAM Role — EC2 Ke Liye

### Step 1 — EC2 Role Banao

```
IAM → Roles → Create Role

1. Trusted entity: AWS Service
2. Use case: EC2
3. Attach policies:
   - AmazonS3FullAccess
   - CloudWatchAgentServerPolicy
   - AmazonSSMManagedInstanceCore (optional — SSM access)
4. Role name: kisan-ec2-role
5. Create Role
```

### Step 2 — EC2 Instance Pe Attach Karo

```
EC2 Console → Instances → Select instance
→ Actions → Security → Modify IAM Role
→ Select: kisan-ec2-role
→ Update IAM Role
```

### Step 3 — Verify Karo (EC2 Pe SSH Karke)

```bash
# EC2 pe SSH karo
ssh -i my-key.pem ubuntu@ec2-ip

# AWS CLI test karo (bina credentials ke!)
aws s3 ls
# Buckets list aa jayegi — IAM Role kaam kar raha hai!

# STS se check karo kaun sa role assume hua
aws sts get-caller-identity
```

> **Expected Output:**
```json
{
    "UserId": "AROA...:i-0abc123",
    "Account": "123456789012",
    "Arn": "arn:aws:sts::123456789012:assumed-role/kisan-ec2-role/i-0abc123"
}
```

> **Tip:** `aws sts get-caller-identity` se pata chalta hai ki current session kaun sa identity use kar rahi hai. Debugging ke liye bahut useful!

---

## Practice 3: Route53 — Custom Domain Setup

### Step 1 — Hosted Zone Create

```
Route53 Console → Hosted Zones → Create Hosted Zone
- Domain: kisanapp.com (tumhara domain)
- Type: Public
- Create
```

### Step 2 — NS Records Domain Registrar Mein Set Karo

```
Route53 se milne wale 4 NS records copy karo:
ns-1234.awsdns-12.org
ns-567.awsdns-34.co.uk
ns-890.awsdns-56.net
ns-1112.awsdns-78.com

Domain Registrar (GoDaddy/Namecheap/etc.) mein jao:
→ DNS Management → Custom Nameservers
→ Paste karo ye 4 NS records
→ Save
```

### Step 3 — DNS Records Add Karo

```
Route53 → kisanapp.com → Create Record

Record 1 — Root domain:
- Name: (empty)
- Type: A
- Value: 54.123.45.67 (EC2 ka Elastic IP)
- TTL: 300
- Create

Record 2 — WWW subdomain:
- Name: www
- Type: CNAME
- Value: kisanapp.com
- TTL: 300
- Create

Record 3 — API subdomain:
- Name: api
- Type: A
- Value: 54.123.45.67
- TTL: 300
- Create
```

### Step 4 — Verify DNS

```bash
# DNS check karo (propagation mein time lagta hai)
nslookup kisanapp.com
nslookup api.kisanapp.com

# Dig se detailed check
dig kisanapp.com +short

# Online tool bhi use kar sakte ho
# https://dnschecker.org
```

> **Expected Output:**
```
Server: 8.8.8.8
Address: 8.8.8.8#53

Name: kisanapp.com
Address: 54.123.45.67
```

### Step 5 — Nginx Config Update (Domain Ke Liye)

```nginx
# /etc/nginx/sites-available/kisan-api

server {
    listen 80;
    server_name kisanapp.com www.kisanapp.com api.kisanapp.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Config test + reload
sudo nginx -t && sudo systemctl reload nginx

# SSL bhi laga do ab domain hai to
sudo certbot --nginx -d kisanapp.com -d www.kisanapp.com -d api.kisanapp.com
```

> **Practice Time!** Domain setup ke baad browser mein `https://kisanapp.com` open karo. API response aana chahiye!

---

## Practice 4: CloudWatch Alarms Setup

### Step 1 — CPU Alarm Banao

```
CloudWatch Console → Alarms → Create Alarm

1. Select Metric:
   → EC2 → Per-Instance Metrics
   → Select: CPUUtilization for your instance

2. Conditions:
   - Threshold: Greater than 80
   - Datapoints: 2 out of 3 (5 min periods)
   - Missing data: Treat as "good" (alarm trigger avoid)

3. Actions:
   - In Alarm: Send to SNS topic "kisan-alerts"
   - OK: Send to SNS topic "kisan-alerts" (recovery notification)

4. Name: kisan-api-high-cpu
5. Create Alarm
```

### Step 2 — SNS Email Notification Setup

```
SNS Console → Topics → Create Topic
- Name: kisan-alerts
- Type: Standard
- Create

→ Create Subscription
- Protocol: Email
- Endpoint: your-email@example.com
- Create

Email check karo → Confirm subscription link click karo
```

### Step 3 — More Alarms Banao

```
Alarm 2: Status Check Failed
- Metric: StatusCheckFailed
- Threshold: Greater than or equal to 1
- Name: kisan-ec2-status-check

Alarm 3: High Network (DDoS detection)
- Metric: NetworkIn
- Threshold: Greater than 1000000000 (1GB in 5 min)
- Name: kisan-api-network-spike
```

### Step 4 — CPU Stress Test (Alarm Trigger)

```bash
# EC2 pe stress tool install karo
sudo apt install stress -y

# CPU ko 2 minutes ke liye stress karo
stress --cpu 2 --timeout 120

# Doosre terminal mein CloudWatch dekho
# 5-10 min mein alarm trigger hoga aur email aayegi!
```

> **Expected Output:** Email mein kuch aisa dikhega:
```
Subject: ALARM: "kisan-api-high-cpu" in Asia Pacific (Mumbai)

Alarm Details:
- State: ALARM
- Reason: Threshold crossed: 2 datapoints [90.5, 85.2] were >= 80
```

---

## Practice 5: CloudWatch Dashboard Banao

### Custom Dashboard

```
CloudWatch Console → Dashboards → Create Dashboard
- Name: kisan-api-monitoring

Add Widgets:
1. Line Chart — CPUUtilization (last 3 hours)
2. Line Chart — NetworkIn + NetworkOut
3. Number — Current CPU %
4. Logs Widget — Recent error logs
5. Alarm Status — All alarms summary
```

### AWS CLI Se Metrics Check

```bash
# Last 1 hour ka CPU usage
aws cloudwatch get-metric-statistics \
    --namespace AWS/EC2 \
    --metric-name CPUUtilization \
    --dimensions Name=InstanceId,Value=i-0abc123 \
    --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
    --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
    --period 300 \
    --statistics Average Maximum

# Alarm status check
aws cloudwatch describe-alarms \
    --alarm-names "kisan-api-high-cpu" \
    --query 'MetricAlarms[0].StateValue'
```

> **Expected Output:**
```json
{
    "Datapoints": [
        { "Timestamp": "2026-04-04T10:00:00Z", "Average": 12.5, "Maximum": 25.0 },
        { "Timestamp": "2026-04-04T10:05:00Z", "Average": 15.2, "Maximum": 30.1 }
    ]
}
```

---

## Quick Revision Table

| Task | Steps | Notes |
|------|-------|-------|
| IAM Group create | Console → IAM → Groups | Policies group pe lagao |
| IAM User create | Console → IAM → Users | Console + programmatic access |
| IAM Role for EC2 | Trusted entity: EC2 → Attach policy | No access keys needed |
| Custom Policy | JSON format: Effect + Action + Resource | Least privilege follow karo |
| Hosted Zone | Route53 → Create Hosted Zone | NS records registrar mein set karo |
| A Record | Domain → IPv4 address | EC2 ka Elastic IP use karo |
| CNAME | Subdomain → Another domain | www → root domain |
| CloudWatch Alarm | Metric → Threshold → SNS action | CPU, StatusCheck, Network |
| SNS Topic | Email notification setup | Confirm subscription zaroori |
| Dashboard | Visual monitoring | Widgets add karo |

---

## Aaj Kya Seekha?

1. **IAM Groups** banaye aur policies attach kiye — developers ko limited access diya
2. **Custom IAM Policy** likhi JSON mein — specific resources pe specific actions allow kiye
3. **IAM Role** EC2 pe attach kiya — ab EC2 pe credentials rakhne ki zaroorat nahi
4. **Route53** se custom domain configure kiya — A records aur CNAME set kiye
5. **DNS propagation** verify kiya `nslookup` aur `dig` se
6. **SSL certificate** domain ke saath setup kiya Certbot se
7. **CloudWatch Alarm** banaya CPU monitoring ke liye — threshold cross hone pe email alert
8. **SNS** se email notifications setup kiye — alarm trigger pe instant notification
