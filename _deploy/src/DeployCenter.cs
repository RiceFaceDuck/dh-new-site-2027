using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace DHNotebook.DeployCenter
{
    public class DeployItem
    {
        public string Name { get; set; }
        public string TargetPath { get; set; }
        public bool HasChanges { get; set; }
        public string ChangeDetails { get; set; }
        public string BuildDir { get; set; }
        public string CheckDistPath { get; set; }
        public string DeployCommand { get; set; }
        public bool IsWebsite { get; set; }
    }

    public class MainForm : Form
    {
        private ListView lvItems;
        private TextBox txtLog;
        private Button btnScan;
        private Button btnSmartDeploy;
        private Button btnDeploySelected;
        private Button btnClearLog;
        private Label lblSummary;
        private StatusStrip statusStrip;
        private ToolStripStatusLabel statusLabel;

        private string rootPath;
        private List<DeployItem> deployItems = new List<DeployItem>();
        private bool isBusy = false;

        [STAThread]
        public static void Main()
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            Application.Run(new MainForm());
        }

        public MainForm()
        {
            string baseDir = AppDomain.CurrentDomain.BaseDirectory.TrimEnd('\\');
            if (baseDir.EndsWith("_deploy", StringComparison.OrdinalIgnoreCase))
            {
                rootPath = Path.GetFullPath(Path.Combine(baseDir, ".."));
            }
            else
            {
                rootPath = baseDir;
            }

            InitializeComponent();
            InitializeItems();
            this.Shown += async (s, e) => await ScanChangesAsync();
        }

        private void InitializeComponent()
        {
            this.Text = "DH Notebook - Deployment Center (Classic Utility v1.1)";
            this.Size = new Size(860, 700);
            this.MinimumSize = new Size(760, 580);
            this.StartPosition = FormStartPosition.CenterScreen;
            this.Font = new Font("Tahoma", 9F, FontStyle.Regular, GraphicsUnit.Point);
            this.BackColor = SystemColors.Control;

            // 1. Top Panel: Header & Controls
            Panel pnlTop = new Panel
            {
                Dock = DockStyle.Top,
                Height = 88,
                Padding = new Padding(12, 10, 12, 6)
            };

            lblSummary = new Label
            {
                Text = "กำลังเตรียมพร้อมระบบ...",
                Font = new Font("Tahoma", 9.5F, FontStyle.Bold),
                Location = new Point(12, 12),
                AutoSize = true
            };

            btnSmartDeploy = new Button
            {
                Text = "🚀 Deploy เฉพาะส่วนที่แก้ไข (Smart Deploy)",
                Location = new Point(12, 40),
                Size = new Size(280, 36),
                Font = new Font("Tahoma", 9F, FontStyle.Bold),
                BackColor = Color.FromArgb(230, 245, 230),
                Cursor = Cursors.Hand
            };
            btnSmartDeploy.Click += async (s, e) => await RunSmartDeployAsync();

            btnScan = new Button
            {
                Text = "🔄 สแกนใหม่",
                Location = new Point(300, 40),
                Size = new Size(110, 36),
                Cursor = Cursors.Hand
            };
            btnScan.Click += async (s, e) => await ScanChangesAsync();

            btnDeploySelected = new Button
            {
                Text = "⚡ Deploy รายการที่เลือก",
                Location = new Point(418, 40),
                Size = new Size(175, 36),
                Cursor = Cursors.Hand
            };
            btnDeploySelected.Click += async (s, e) => await RunDeploySelectedAsync();

            btnClearLog = new Button
            {
                Text = "ล้าง Log",
                Location = new Point(601, 40),
                Size = new Size(80, 36),
                Cursor = Cursors.Hand
            };
            btnClearLog.Click += (s, e) => txtLog.Clear();

            pnlTop.Controls.AddRange(new Control[] { lblSummary, btnSmartDeploy, btnScan, btnDeploySelected, btnClearLog });

            // 2. Middle: ListView Items (Status Box)
            GroupBox grpStatus = new GroupBox
            {
                Text = " สรุปรายการระบบและสถานะความพร้อม (Status Overview) ",
                Dock = DockStyle.Top,
                Height = 225,
                Padding = new Padding(10)
            };

            lvItems = new ListView
            {
                Dock = DockStyle.Fill,
                View = View.Details,
                FullRowSelect = true,
                GridLines = true,
                MultiSelect = false,
                Font = new Font("Tahoma", 9F)
            };
            lvItems.Columns.Add("ส่วนงาน (Component)", 230);
            lvItems.Columns.Add("สถานะความเปลี่ยนแปลง (Status)", 210);
            lvItems.Columns.Add("รายละเอียดไฟล์ที่พบการแก้ไข (Details)", 370);

            grpStatus.Controls.Add(lvItems);

            // 3. Bottom: Output Log
            GroupBox grpLog = new GroupBox
            {
                Text = " บันทึกผลการทำงานสด (Live Output Log) ",
                Dock = DockStyle.Fill,
                Padding = new Padding(10)
            };

            txtLog = new TextBox
            {
                Dock = DockStyle.Fill,
                Multiline = true,
                ScrollBars = ScrollBars.Both,
                ReadOnly = true,
                BackColor = Color.White,
                ForeColor = Color.Black,
                Font = new Font("Consolas", 9F, FontStyle.Regular)
            };
            grpLog.Controls.Add(txtLog);

            // 4. Status Strip
            statusStrip = new StatusStrip();
            statusLabel = new ToolStripStatusLabel { Text = "พร้อมใช้งาน" };
            statusStrip.Items.Add(statusLabel);

            this.Controls.Add(grpLog);
            this.Controls.Add(grpStatus);
            this.Controls.Add(pnlTop);
            this.Controls.Add(statusStrip);
        }

        private void InitializeItems()
        {
            deployItems = new List<DeployItem>
            {
                new DeployItem 
                { 
                    Name = "1. หน้าร้านหลัก (dh-frontend)", 
                    TargetPath = "dh-frontend", 
                    BuildDir = "dh-frontend", 
                    CheckDistPath = "dh-frontend/dist",
                    DeployCommand = "firebase deploy --only hosting:dh-notebook-frontend",
                    IsWebsite = true
                },
                new DeployItem 
                { 
                    Name = "2. ระบบหลังร้าน (dh-backoffice-react)", 
                    TargetPath = "dh-backoffice-react", 
                    BuildDir = "dh-backoffice-react", 
                    CheckDistPath = "dh-backoffice-react/dist",
                    DeployCommand = "firebase deploy --only hosting:dhnotebook-work",
                    IsWebsite = true
                },
                new DeployItem 
                { 
                    Name = "3. แอปพนักงาน (dh-staff-app)", 
                    TargetPath = "dh-staff-app", 
                    BuildDir = "dh-staff-app", 
                    CheckDistPath = "dh-staff-app/dist",
                    DeployCommand = "firebase deploy --only hosting:dh-notebook-69f3b",
                    IsWebsite = true
                },
                new DeployItem 
                { 
                    Name = "4. ฟังก์ชันคลาวด์ (Cloud Functions)", 
                    TargetPath = "functions", 
                    DeployCommand = "",
                    IsWebsite = false
                },
                new DeployItem 
                { 
                    Name = "5. กฎความปลอดภัย (Security Rules)", 
                    TargetPath = "rules", 
                    DeployCommand = "firebase deploy --only firestore:rules,storage",
                    IsWebsite = false
                },
                new DeployItem 
                { 
                    Name = "6. ดัชนีฐานข้อมูล (Firestore Indexes)", 
                    TargetPath = "indexes", 
                    DeployCommand = "firebase deploy --only firestore:indexes",
                    IsWebsite = false
                },
                new DeployItem 
                { 
                    Name = "7. ซิงค์งาน (Git Commit & Push)", 
                    TargetPath = "git", 
                    DeployCommand = "git push origin main",
                    IsWebsite = false
                }
            };
        }

        private void AppendLog(string text)
        {
            if (this.InvokeRequired)
            {
                this.Invoke(new Action<string>(AppendLog), text);
                return;
            }
            txtLog.AppendText(text + Environment.NewLine);
        }

        private void SetStatus(string text, bool busy)
        {
            if (this.InvokeRequired)
            {
                this.Invoke(new Action<string, bool>(SetStatus), text, busy);
                return;
            }
            statusLabel.Text = text;
            isBusy = busy;
            btnScan.Enabled = !busy;
            btnSmartDeploy.Enabled = !busy;
            btnDeploySelected.Enabled = !busy;
        }

        private string RunHiddenCmd(string command, string workingDir)
        {
            try
            {
                ProcessStartInfo psi = new ProcessStartInfo("cmd.exe", "/c " + command)
                {
                    WorkingDirectory = string.IsNullOrEmpty(workingDir) ? rootPath : Path.Combine(rootPath, workingDir),
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                    UseShellExecute = false,
                    CreateNoWindow = true,
                    StandardOutputEncoding = Encoding.UTF8,
                    StandardErrorEncoding = Encoding.UTF8
                };
                using (Process p = Process.Start(psi))
                {
                    string output = p.StandardOutput.ReadToEnd();
                    p.WaitForExit();
                    return output;
                }
            }
            catch (Exception ex)
            {
                return "ERR: " + ex.Message;
            }
        }

        private async Task ScanChangesAsync()
        {
            if (isBusy) return;
            SetStatus("กำลังสแกนหาความเปลี่ยนแปลง...", true);
            AppendLog(string.Format("[{0:HH:mm:ss}] 🔍 เริ่มต้นตรวจสอบสถานะโปรเจกต์...", DateTime.Now));

            await Task.Run(() =>
            {
                // 1. Get Uncommitted files
                string gitStatusOutput = RunHiddenCmd("git status --porcelain", null);
                string[] statusLines = gitStatusOutput.Split(new[] { '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries);

                // 2. Get Unpushed commits files
                string gitUnpushedOutput = RunHiddenCmd("git log origin/main..HEAD --name-only --oneline", null);
                string[] unpushedLines = gitUnpushedOutput.Split(new[] { '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries);

                HashSet<string> changedFiles = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
                foreach (var line in statusLines)
                {
                    if (line.Length > 3)
                    {
                        changedFiles.Add(line.Substring(3).Trim());
                    }
                }
                foreach (var line in unpushedLines)
                {
                    if (!line.Contains(" ") && line.Contains("/"))
                    {
                        changedFiles.Add(line.Trim());
                    }
                }

                // Unpushed commits count
                string unpushedCommitsRaw = RunHiddenCmd("git log origin/main..HEAD --oneline", null);
                int unpushedCommitsCount = unpushedCommitsRaw.Split(new[] { '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries).Length;

                // Reset items
                foreach (var item in deployItems)
                {
                    item.HasChanges = false;
                    item.ChangeDetails = "ปกติ (ไม่มีการแก้ไข)";
                }

                int feCount = 0, boCount = 0, saCount = 0, fnCount = 0;
                List<string> fnTargets = new List<string>();

                foreach (var file in changedFiles)
                {
                    if (file.StartsWith("dh-frontend/", StringComparison.OrdinalIgnoreCase)) feCount++;
                    else if (file.StartsWith("dh-backoffice-react/", StringComparison.OrdinalIgnoreCase)) boCount++;
                    else if (file.StartsWith("dh-staff-app/", StringComparison.OrdinalIgnoreCase)) saCount++;
                    else if (file.IndexOf("firestore.rules", StringComparison.OrdinalIgnoreCase) >= 0 || file.IndexOf("storage.rules", StringComparison.OrdinalIgnoreCase) >= 0)
                    {
                        deployItems[4].HasChanges = true;
                        deployItems[4].ChangeDetails = "พบการแก้ไข Rules: " + Path.GetFileName(file);
                    }
                    else if (file.IndexOf("firestore.indexes.json", StringComparison.OrdinalIgnoreCase) >= 0)
                    {
                        deployItems[5].HasChanges = true;
                        deployItems[5].ChangeDetails = "พบการแก้ไขดัชนี Index ฐานข้อมูล";
                    }
                    else if (file.StartsWith("functions/", StringComparison.OrdinalIgnoreCase))
                    {
                        fnCount++;
                        string fnName = DetectSpecificFunctionName(file);
                        if (!string.IsNullOrEmpty(fnName) && !fnTargets.Contains(fnName))
                        {
                            fnTargets.Add(fnName);
                        }
                    }
                }

                // 1. Frontend
                if (feCount > 0)
                {
                    deployItems[0].HasChanges = true;
                    deployItems[0].ChangeDetails = string.Format("ตรวจพบการแก้ไข {0} ไฟล์", feCount);
                }

                // 2. Backoffice
                if (boCount > 0)
                {
                    deployItems[1].HasChanges = true;
                    deployItems[1].ChangeDetails = string.Format("ตรวจพบการแก้ไข {0} ไฟล์", boCount);
                }

                // 3. Staff App
                if (saCount > 0)
                {
                    deployItems[2].HasChanges = true;
                    deployItems[2].ChangeDetails = string.Format("ตรวจพบการแก้ไข {0} ไฟล์", saCount);
                }

                // 4. Functions
                if (fnCount > 0)
                {
                    deployItems[3].HasChanges = true;
                    if (fnTargets.Count > 0)
                    {
                        string targetsStr = string.Join(",", fnTargets.ToArray());
                        deployItems[3].ChangeDetails = string.Format("ตรวจพบ {0} ไฟล์ (เป้าหมาย: {1})", fnCount, targetsStr);
                        deployItems[3].DeployCommand = string.Format("firebase deploy --only functions:{0}", targetsStr);
                    }
                    else
                    {
                        deployItems[3].ChangeDetails = string.Format("ตรวจพบ {0} ไฟล์ใน functions/", fnCount);
                        deployItems[3].DeployCommand = "firebase deploy --only functions";
                    }
                }

                // 7. Git Push
                if (unpushedCommitsCount > 0 || statusLines.Length > 0)
                {
                    deployItems[6].HasChanges = true;
                    deployItems[6].ChangeDetails = unpushedCommitsCount > 0 
                        ? string.Format("มี {0} Commits รอ Push ขึ้น GitHub", unpushedCommitsCount) 
                        : string.Format("มี {0} ไฟล์ในเครื่องยังไม่ได้ Commit", statusLines.Length);
                }
            });

            // Update UI
            lvItems.Items.Clear();
            int totalChanges = 0;
            foreach (var item in deployItems)
            {
                ListViewItem lvi = new ListViewItem(item.Name);
                if (item.HasChanges)
                {
                    totalChanges++;
                    lvi.SubItems.Add("[!] ตรวจพบการแก้ไข");
                    lvi.SubItems.Add(item.ChangeDetails);
                    lvi.ForeColor = Color.DarkGoldenrod;
                    lvi.Font = new Font("Tahoma", 9F, FontStyle.Bold);
                }
                else
                {
                    lvi.SubItems.Add("[✓] ปกติ (ไม่มีการแก้ไข)");
                    lvi.SubItems.Add("-");
                    lvi.ForeColor = Color.DarkGreen;
                }
                lvi.Tag = item;
                lvItems.Items.Add(lvi);
            }

            if (totalChanges > 0)
            {
                lblSummary.Text = string.Format("📊 ตรวจพบรายการที่ต้อง Deploy ทั้งหมด {0} ส่วน (กดปุ่ม Smart Deploy ได้ทันที)", totalChanges);
                lblSummary.ForeColor = Color.DarkGoldenrod;
            }
            else
            {
                lblSummary.Text = "✅ ทุกระบบตรงกับ Cloud 100% ไม่มีรายการค้างที่ต้อง Deploy";
                lblSummary.ForeColor = Color.DarkGreen;
            }

            AppendLog(string.Format("[{0:HH:mm:ss}] สแกนเสร็จสิ้น: พบส่วนที่มีการแก้ไข {1} รายการ", DateTime.Now, totalChanges));
            SetStatus("สแกนเรียบร้อย พร้อมใช้งาน", false);
        }

        private string DetectSpecificFunctionName(string filePath)
        {
            string p = filePath.Replace('\\', '/');
            if (p.Contains("marketing/recordAdTelemetry")) return "recordAdTelemetry";
            if (p.Contains("marketing/ga4AdSync")) return "ga4AdSyncCron,ga4AdSyncManual";
            if (p.Contains("marketing/partnerVisibilitySync")) return "partnerVisibilitySync";
            if (p.Contains("slips/verifySlipOcr")) return "verifySlipOcr";
            if (p.Contains("slips/purgeOldSlips")) return "purgeOldSlips";
            if (p.Contains("inventory/nightlyChunkGuard")) return "nightlyChunkGuard";
            if (p.Contains("inventory/walletFunctions")) return "processWalletPayment,requestWithdrawal,calculate30DStatsCron,calculate30DStatsHttp,rebuildAllChunksManual,migrateHistoricalStats,syncProductToGas,verifyADAC001";
            if (p.Contains("auth/userClaimsTrigger")) return "userClaimsTrigger";
            return "";
        }

        private bool ExecuteDeployItem(DeployItem t)
        {
            if (t.TargetPath == "git") return true;

            AppendLog(string.Format("\n>>> กำลังประมวลผล: {0}...", t.Name));

            if (t.IsWebsite)
            {
                // [Step 1] Build ในโฟลเดอร์โปรเจกต์
                string buildWorkDir = Path.Combine(rootPath, t.BuildDir);
                AppendLog(string.Format("🔨 [1/2] กำลัง Build โครงสร้าง ({0})...", t.BuildDir));
                int buildCode = ExecuteProcessWithLog("cmd.exe", "/c npm run build", buildWorkDir);
                if (buildCode != 0)
                {
                    AppendLog(string.Format("❌ [ERROR] Build ล้มเหลว (รหัส: {0}) ยกเลิกการ Deploy เว็บไซต์นี้!", buildCode));
                    return false;
                }

                // ตรวจสอบความถูกต้องของโฟลเดอร์ dist ก่อน deploy
                string fullDistPath = Path.Combine(rootPath, t.CheckDistPath);
                if (!Directory.Exists(fullDistPath))
                {
                    AppendLog(string.Format("❌ [ERROR] ไม่พบโฟลเดอร์ผลลัพธ์: {0} กรุณาตรวจสอบการ build", t.CheckDistPath));
                    return false;
                }
                AppendLog(string.Format("✅ Build สำเร็จสมบูรณ์! พร้อมส่งไฟล์ขึ้น Hosting"));

                // [Step 2] Deploy ขึ้น Firebase Hosting (รันที่ rootPath เสมอ เพื่อให้อิง firebase.json ได้ถูกต้อง 100%)
                AppendLog(string.Format("🚀 [2/2] กำลังส่งไฟล์ขึ้น Firebase Hosting..."));
                int deployCode = ExecuteProcessWithLog("cmd.exe", "/c " + t.DeployCommand, rootPath);
                if (deployCode != 0)
                {
                    AppendLog(string.Format("❌ [ERROR] Firebase Hosting Deploy ล้มเหลว (รหัส: {0})", deployCode));
                    return false;
                }

                AppendLog(string.Format("✅ สำเร็จสมบูรณ์: {0}", t.Name));
                return true;
            }
            else
            {
                // Non-website (Functions, Rules, Indexes) รันที่ rootPath เสมอ
                if (!string.IsNullOrEmpty(t.DeployCommand))
                {
                    AppendLog(string.Format("🚀 กำลังสั่งรัน: {0}...", t.DeployCommand));
                    int code = ExecuteProcessWithLog("cmd.exe", "/c " + t.DeployCommand, rootPath);
                    if (code != 0)
                    {
                        AppendLog(string.Format("❌ [ERROR] คำสั่งล้มเหลว (รหัส: {0})", code));
                        return false;
                    }
                    AppendLog(string.Format("✅ สำเร็จสมบูรณ์: {0}", t.Name));
                    return true;
                }
                return true;
            }
        }

        private async Task RunSmartDeployAsync()
        {
            if (isBusy) return;

            List<DeployItem> targets = deployItems.FindAll(x => x.HasChanges);
            if (targets.Count == 0)
            {
                MessageBox.Show("ไม่มีรายการใดที่มีการแก้ไข ระบบตรงกับ Cloud สมบูรณ์อยู่แล้วครับ", "แจ้งเตือน", MessageBoxButtons.OK, MessageBoxIcon.Information);
                return;
            }

            StringBuilder sb = new StringBuilder();
            sb.AppendLine("ระบบจะดำเนินการ Deploy เฉพาะส่วนที่ตรวจพบการแก้ไข ดังนี้:\n");
            foreach (var t in targets)
            {
                sb.AppendLine(" • " + t.Name + " (" + t.ChangeDetails + ")");
            }
            sb.AppendLine("\nคุณต้องการเริ่มดำเนินการทันทีหรือไม่?");

            if (MessageBox.Show(sb.ToString(), "ยืนยัน Smart Deploy", MessageBoxButtons.YesNo, MessageBoxIcon.Question) != DialogResult.Yes)
            {
                return;
            }

            SetStatus("กำลังดำเนินการ Smart Deploy...", true);
            AppendLog("\n=======================================================");
            AppendLog(string.Format("[{0:HH:mm:ss}] 🚀 เริ่มต้นกระบวนการ Smart Deploy", DateTime.Now));
            AppendLog("=======================================================");

            await Task.Run(() =>
            {
                // 1. Auto Commit if needed
                string uncommitted = RunHiddenCmd("git status --porcelain", null);
                if (!string.IsNullOrWhiteSpace(uncommitted))
                {
                    AppendLog("📦 กำลังบันทึกงานในเครื่อง (Git Commit)...");
                    ExecuteProcessWithLog("git", "add .", rootPath);
                    string commitMsg = string.Format("อัปเดตงานอัตโนมัติ {0:dd/MM/yyyy HH:mm}", DateTime.Now);
                    ExecuteProcessWithLog("git", string.Format("commit -m \"{0}\"", commitMsg), rootPath);
                }

                // 2. Deploy Changed Targets
                foreach (var t in targets)
                {
                    ExecuteDeployItem(t);
                }

                // 3. Git Push
                AppendLog("\n🚀 กำลังส่งโค้ดขึ้น GitHub (Git Push origin main)...");
                int pushCode = ExecuteProcessWithLog("git", "push origin main", rootPath);
                if (pushCode == 0)
                {
                    AppendLog("✅ ส่งขึ้น GitHub เรียบร้อยสมบูรณ์!");
                }
                else
                {
                    AppendLog("⚠️ Push ขึ้น GitHub มีข้อความแจ้งเตือน โปรดตรวจสอบการเชื่อมต่ออินเทอร์เน็ต");
                }
            });

            AppendLog("\n=======================================================");
            AppendLog(string.Format("[{0:HH:mm:ss}] 🎉 Smart Deploy เสร็จสิ้นสมบูรณ์!", DateTime.Now));
            AppendLog("=======================================================\n");

            SetStatus("Smart Deploy เสร็จสมบูรณ์", false);
            await ScanChangesAsync();
        }

        private async Task RunDeploySelectedAsync()
        {
            if (isBusy || lvItems.SelectedItems.Count == 0)
            {
                MessageBox.Show("กรุณาคลิกเลือกรายการที่ต้องการ Deploy จากตารางด้านบนก่อนครับ", "แจ้งเตือน", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                return;
            }

            DeployItem selectedItem = lvItems.SelectedItems[0].Tag as DeployItem;
            if (selectedItem == null) return;

            if (MessageBox.Show(string.Format("คุณต้องการ Deploy รายการนี้ใช่หรือไม่?\n\n{0}", selectedItem.Name), "ยืนยันการ Deploy", MessageBoxButtons.YesNo, MessageBoxIcon.Question) != DialogResult.Yes)
            {
                return;
            }

            SetStatus(string.Format("กำลัง Deploy: {0}...", selectedItem.Name), true);
            AppendLog(string.Format("\n[{0:HH:mm:ss}] เริ่ม Deploy: {0}", DateTime.Now, selectedItem.Name));

            await Task.Run(() =>
            {
                if (selectedItem.TargetPath == "git")
                {
                    ExecuteProcessWithLog("git", "add .", rootPath);
                    ExecuteProcessWithLog("git", string.Format("commit -m \"อัปเดตงาน {0:dd/MM/yyyy HH:mm}\"", DateTime.Now), rootPath);
                    ExecuteProcessWithLog("git", "push origin main", rootPath);
                }
                else if (selectedItem.TargetPath == "functions")
                {
                    string cmd = !string.IsNullOrEmpty(selectedItem.DeployCommand) 
                        ? selectedItem.DeployCommand 
                        : "firebase deploy --only functions";
                    ExecuteProcessWithLog("cmd.exe", "/c " + cmd, rootPath);
                }
                else
                {
                    ExecuteDeployItem(selectedItem);
                }
            });

            AppendLog(string.Format("[{0:HH:mm:ss}] เสร็จสิ้น: {0}\n", DateTime.Now, selectedItem.Name));
            SetStatus("ดำเนินการเสร็จสิ้น", false);
            await ScanChangesAsync();
        }

        private int ExecuteProcessWithLog(string exe, string args, string workingDir)
        {
            try
            {
                AppendLog(string.Format("> [{0}] {1} {2}", Path.GetFileName(workingDir), exe, args));
                ProcessStartInfo psi = new ProcessStartInfo(exe, args)
                {
                    WorkingDirectory = workingDir,
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                    UseShellExecute = false,
                    CreateNoWindow = true,
                    StandardOutputEncoding = Encoding.UTF8,
                    StandardErrorEncoding = Encoding.UTF8
                };

                using (Process p = new Process())
                {
                    p.StartInfo = psi;
                    p.OutputDataReceived += (s, e) => { if (e.Data != null) AppendLog(e.Data); };
                    p.ErrorDataReceived += (s, e) => { if (e.Data != null) AppendLog(e.Data); };
                    p.Start();
                    p.BeginOutputReadLine();
                    p.BeginErrorReadLine();
                    p.WaitForExit();
                    return p.ExitCode;
                }
            }
            catch (Exception ex)
            {
                AppendLog("❌ Execution Error: " + ex.Message);
                return -1;
            }
        }
    }
}
