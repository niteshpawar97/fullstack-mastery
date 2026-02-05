# Day 72 Morning: AWS IAM + Route53 + CloudWatch

> **Aaj ka plan:** Aaj hum AWS ke teen critical services seekhenge — IAM (security/access control), Route53 (DNS/domain management), aur CloudWatch (monitoring/alerts). Ye services production infrastructure ka backbone hain.

---

## AWS IAM — Identity & Access Management

### IAM Kya Hai?

IAM (Identity and Access Management) AWS ka security service hai — kaun kya kar sakta hai, ye control karta hai. Bina IAM ke sab kuch root account se hoga — jo bahut dangerous hai.

> **Socho Aise:** Socho ek badi company hai. IAM = company ka HR + security department. HR decide karta hai kaun employee hai (users), kaunsa department hai (groups), kya kaam kar sakte hain (policies), aur kaunsa badge dena hai (roles). Bina HR ke koi bhi kuch bhi kar sakta hai — chaos!

### IAM Ke Core Concepts

| Concept | Kya Hai | Example |
|---------|---------|---------|
| **User** | Ek person ya application | Developer "Rahul", CI/CD bot |
| **Group** | Users ka collection | "Developers", "DevOps", "Interns" |
| **Role** | Temporary permission set | EC2 ko S3 access dena |
| **Policy** | Permission rules (JSON) | "S3 read-only", "EC2 full access" |
| **Root Account** | Master account (AWS sign-up wala) | Sab kuch kar sakta hai — DANGEROUS! |

---

## Principle of Least Privilege

### Sabse Important Security Rule

> **Yaad Rakho:** Har user/service ko SIRF utna permission do jitna zaroori hai — ek byte zyada nahi! Ye "Principle of Least Privilege" hai.

```
BAD Practice:
Developer → AdministratorAccess (full AWS access)
Result: Accidentally delete kar sakta hai entire production database!

GOOD Practice:
Developer → S3ReadOnly + EC2StartStop (sirf zaroori permissions)
Result: Galti se bhi critical resources delete nahi ho sakte
```

> **Socho Aise:** Ghar ki chabi sab ko de doge to koi bhi aa sakta hai. Lekin security guard ko sirf gate ki chabi do, cook ko sirf kitchen ki, driver ko sirf garage ki — ye hai least privilege.

---

## IAM Users Banana

### Step 1 — User Create Karo

```
AWS Console → IAM → Users → Create User

1. User name: rahul-developer
2. Access type:
   - ✅ AWS Management Console access (browser login)
   - ✅ Programmatic access (CLI/SDK ke liye)
3. Set permissions (next step)
```

### Step 2 — Group Se Permission Do

```
AWS Console → IAM → User Groups → Create Group

Group name: backend-developers
Attach policies:
- AmazonS3FullAccess
- AmazonRDSReadOnlyAccess
- AmazonEC2ReadOnlyAccess
- CloudWatchLogsReadOnlyAccess

Add user "rahul-developer" to this group
```

### IAM Policy — JSON Format

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "AllowS3BucketAccess",
            "Effect": "Allow",
            "Action": [
                "s3:GetObject",
                "s3:PutObject",
                "s3:ListBucket"
            ],
            "Resource": [
                "arn:aws:s3:::kisan-app-uploads",
                "arn:aws:s3:::kisan-app-uploads/*"
            ]
        },
        {
            "Sid": "DenyDeleteBucket",
            "Effect": "Deny",
            "Action": "s3:DeleteBucket",
            "Resource": "*"
        }
    ]
}
```

> **Yaad Rakho:** Policy mein `Effect: Deny` hamesha `Allow` se jeetega. Agar Allow aur Deny dono hain kisi action pe, to Deny win karega — extra safety!

---

## IAM Roles — Services Ke Liye

### EC2 Ko S3 Access Dena (Without Credentials!)

```
Problem:  EC2 pe AWS credentials (.env mein) rakhna = risky
Solution: IAM Role attach karo EC2 ko — credentials ki zaroorat nahi!

AWS Console → IAM → Roles → Create Role
1. Trusted entity: AWS Service → EC2
2. Attach policy: AmazonS3FullAccess
3. Role name: ec2-s3-access-role
4. Create Role

EC2 Console → Instance → Actions → Security → Modify IAM Role
→ Select: ec2-s3-access-role → Update
```

```javascript
// Ab EC2 pe credentials ki zaroorat nahi!
// AWS SDK automatically IAM Role se credentials lega

const { S3Client } = require('@aws-sdk/client-s3');

// Credentials provide nahi karna — IAM Role se auto milega
const s3Client = new S3Client({
    region: 'ap-south-1'
    // credentials: NOT NEEDED on EC2 with IAM Role!
});
```

> **Tip:** Production mein HAMESHA IAM Roles use karo, access keys nahi. Roles temporary credentials dete hain jo auto-rotate hote hain — zyada secure!

---

## Programmatic Access — Access Keys

```bash
# IAM User ke liye access keys generate karo
# AWS Console → IAM → Users → rahul-developer → Security credentials → Create access key

# AWS CLI configure karo
aws configure --profile rahul
# AWS Access Key ID: AKIA...
# AWS Secret Access Key: xxxx...
# Region: ap-south-1

# Test karo
aws s3 ls --profile rahul

# Access key rotate karo (regularly)
aws iam create-access-key --user-name rahul-developer
aws iam delete-access-key --user-name rahul-developer --access-key-id AKIA_OLD_KEY
```

> **Warning:** Access keys ko Git mein KABHI push mat karo! Agar accidentally push ho gaye to turant rotate karo — bots seconds mein leaked keys se crypto mining start kar dete hain.

---

## AWS Route53 — DNS Management

### Route53 Kya Hai?

Route53 AWS ka DNS (Domain Name System) service hai — domain names ko IP addresses mein translate karta hai.

> **Socho Aise:** DNS = phone book. Tum yaad rakhte ho "Rahul ka number" — phone book usse `9876543210` mein convert karta hai. Route53 = internet ka phone book — `kisanapp.com` ko `54.123.45.67` mein convert karta hai.

### DNS Records Types

| Record Type | Kya Karta Hai | Example |
|-------------|---------------|---------|
| **A** | Domain → IPv4 address | `kisanapp.com → 54.123.45.67` |
| **AAAA** | Domain → IPv6 address | `kisanapp.com → 2001:db8::1` |
| **CNAME** | Domain → Another domain | `www.kisanapp.com → kisanapp.com` |
| **MX** | Mail server | Email ke liye |
| **TXT** | Text record | SSL verification, SPF |
| **NS** | Name server | Domain ka DNS server |
| **ALIAS** | AWS-specific (root domain) | `kisanapp.com → d1234.cloudfront.net` |

---

## Route53 Setup

### Step 1 — Hosted Zone Create

```
Route53 Console → Hosted Zones → Create Hosted Zone
- Domain name: kisanapp.com
- Type: Public hosted zone
- Create

Result: 4 NS records milenge — ye domain registrar mein set karo
```

### Step 2 — DNS Records Add Karo

```
Route53 → Hosted Zone → kisanapp.com → Create Record

Record 1: Main domain → EC2
- Name: (blank — root domain)
- Type: A
- Value: 54.123.45.67 (EC2 IP)
- TTL: 300

Record 2: WWW subdomain → root
- Name: www
- Type: CNAME
- Value: kisanapp.com
- TTL: 300

Record 3: API subdomain → EC2
- Name: api
- Type: A
- Value: 54.123.45.67
- TTL: 300
```

### Step 3 — Domain Registrar Mein NS Records Set

```
Apne domain registrar (GoDaddy, Namecheap, etc.) mein jao
→ DNS settings → Nameservers → Custom

Route53 ke NS records paste karo:
ns-1234.awsdns-12.org
ns-5678.awsdns-34.co.uk
ns-910.awsdns-56.net
ns-1112.awsdns-78.com

Propagation mein 24-48 hours lag sakte hain
```

> **Tip:** `nslookup kisanapp.com` ya `dig kisanapp.com` se check karo ki DNS propagate ho gaya ya nahi. Online tools: `dnschecker.org`

---

## AWS CloudWatch — Monitoring & Alerts

### CloudWatch Kya Hai?

CloudWatch AWS ka monitoring service hai — metrics collect karta hai, logs store karta hai, aur alarms set kar sakte ho.

> **Socho Aise:** CloudWatch = tumhare server ka health monitor (BP machine + heart rate monitor). Kuch bhi abnormal hua — alert aa jayega mobile pe!

### CloudWatch Ke Components

| Component | Kya Karta Hai | Example |
|-----------|---------------|---------|
| **Metrics** | Numerical data points | CPU usage: 85% |
| **Alarms** | Threshold pe notification | CPU > 80% for 5 min → alert |
| **Logs** | Application/system logs | Nginx error logs, app logs |
| **Dashboards** | Visual monitoring | Graphs, charts |
| **Events** | Automated responses | CPU high → auto scale |

### Default EC2 Metrics (Free)

```
CloudWatch automatically track karta hai:
- CPUUtilization (%)
- NetworkIn/Out (bytes)
- DiskReadOps / DiskWriteOps
- StatusCheckFailed

Detailed Monitoring (paid, 1-minute interval):
- Memory Usage (custom metric chahiye)
- Disk Space (custom metric chahiye)
```

---

## CloudWatch Alarms

### CPU Alert Setup

```
CloudWatch Console → Alarms → Create Alarm

1. Select metric: EC2 → Per-Instance Metrics → CPUUtilization
2. Select instance: i-0abc123 (tumhara EC2)
3. Conditions:
   - Threshold type: Static
   - Whenever CPUUtilization is: Greater than 80
   - For: 2 out of 3 datapoints (false positive avoid)
4. Actions:
   - Send notification to: SNS topic (email alert)
   - Auto Scaling action (optional)
5. Name: kisan-api-high-cpu
6. Create Alarm
```

### SNS Topic Banana (Email Notifications)

```
SNS Console → Topics → Create Topic
- Name: kisan-alerts
- Type: Standard
- Create

Subscriptions → Create Subscription
- Topic: kisan-alerts
- Protocol: Email
- Endpoint: your-email@example.com
- Create (email mein confirm link aayega)
```

### CloudWatch Logs — Application Logs

```bash
# CloudWatch Logs Agent install karo EC2 pe
sudo apt install amazon-cloudwatch-agent -y

# Agent config banao
sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-config-wizard

# Ya manual config:
```

```json
{
    "logs": {
        "logs_collected": {
            "files": {
                "collect_list": [
                    {
                        "file_path": "/home/ubuntu/kisan-api/logs/*.log",
                        "log_group_name": "/kisan-api/app-logs",
                        "log_stream_name": "{instance_id}",
                        "timezone": "UTC"
                    },
                    {
                        "file_path": "/var/log/nginx/error.log",
                        "log_group_name": "/kisan-api/nginx-errors",
                        "log_stream_name": "{instance_id}"
                    }
                ]
            }
        }
    }
}
```

```bash
# Agent start karo
sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
    -a fetch-config -m ec2 -s \
    -c file:/opt/aws/amazon-cloudwatch-agent/etc/config.json
```

> **Yaad Rakho:** CloudWatch Logs Agent EC2 pe install karna padta hai. IAM Role mein `CloudWatchAgentServerPolicy` attach hona chahiye.

---

## Quick Revision Table

| Service | Kya Hai | Key Concept |
|---------|---------|-------------|
| IAM User | Person/app identity | Console + programmatic access |
| IAM Group | Users ka collection | Group pe policy laga do, saare users ko mile |
| IAM Role | Service permissions | EC2 ko S3 access dena (no credentials) |
| IAM Policy | Permission rules (JSON) | Allow/Deny + Actions + Resources |
| Least Privilege | Minimum permissions | Sirf zaroori access do |
| Route53 | DNS service | Domain → IP mapping |
| A Record | Domain → IP | `kisanapp.com → 54.x.x.x` |
| CNAME | Domain → Domain | `www → kisanapp.com` |
| CloudWatch | Monitoring + Alerts | Metrics, Logs, Alarms |
| SNS | Notification service | Email/SMS alerts |

---

## Aaj Kya Seekha?

1. **IAM** AWS ka security foundation hai — users, groups, roles, policies se access control hota hai
2. **Principle of Least Privilege** — sirf utna permission do jitna zaroori hai, ek byte zyada nahi
3. **IAM Roles** production mein access keys se better hain — temporary credentials auto-rotate hote hain
4. **Route53** DNS management hai — domain ko IP se map karta hai (A records, CNAMEs)
5. **DNS propagation** 24-48 hours tak lag sakta hai — patience rakho
6. **CloudWatch** monitoring ka king hai — metrics, logs, alarms sab ek jagah
7. **CloudWatch Alarms** se CPU, memory abnormal hone pe email/SMS alert aa jata hai
8. Ye teeno services milke **secure, accessible, aur monitored** infrastructure banate hain
