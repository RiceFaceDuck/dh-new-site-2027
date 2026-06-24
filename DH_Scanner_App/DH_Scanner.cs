using System;
using System.Drawing;
using System.Windows.Forms;
using System.Management;
using System.Diagnostics;
using System.Collections.Generic;

namespace DHScanner
{
    public class MainForm : Form
    {
        private Button startButton;
        private Label statusLabel;
        private string targetBaseUrl = "https://dh-notebook-frontend.web.app/hardware-scanner"; // URL จริงของระบบ

        public MainForm()
        {
            this.Text = "DH Hardware Scanner";
            this.Size = new Size(400, 250);
            this.StartPosition = FormStartPosition.CenterScreen;
            this.FormBorderStyle = FormBorderStyle.FixedDialog;
            this.MaximizeBox = false;
            this.BackColor = Color.White;

            Label titleLabel = new Label();
            titleLabel.Text = "DH NOTEBOOK";
            titleLabel.Font = new Font("Arial", 20, FontStyle.Bold);
            titleLabel.ForeColor = Color.ForestGreen;
            titleLabel.AutoSize = true;
            titleLabel.Location = new Point(90, 30);
            this.Controls.Add(titleLabel);

            Label subtitleLabel = new Label();
            subtitleLabel.Text = "System Information Scanner";
            subtitleLabel.Font = new Font("Arial", 10, FontStyle.Regular);
            subtitleLabel.ForeColor = Color.Gray;
            subtitleLabel.AutoSize = true;
            subtitleLabel.Location = new Point(105, 60);
            this.Controls.Add(subtitleLabel);

            startButton = new Button();
            startButton.Text = "เริ่มตรวจสอบสเปคเครื่อง";
            startButton.Font = new Font("Tahoma", 12, FontStyle.Bold);
            startButton.Size = new Size(250, 50);
            startButton.Location = new Point(65, 100);
            startButton.BackColor = Color.FromArgb(40, 167, 69);
            startButton.ForeColor = Color.White;
            startButton.FlatStyle = FlatStyle.Flat;
            startButton.Cursor = Cursors.Hand;
            startButton.Click += new EventHandler(StartButton_Click);
            this.Controls.Add(startButton);

            statusLabel = new Label();
            statusLabel.Text = "คลิกปุ่มเพื่ออ่านค่า Hardware แล้วไปที่หน้าเว็บ";
            statusLabel.Font = new Font("Tahoma", 9, FontStyle.Regular);
            statusLabel.AutoSize = true;
            statusLabel.Location = new Point(70, 165);
            this.Controls.Add(statusLabel);
        }

        private void StartButton_Click(object sender, EventArgs e)
        {
            try
            {
                startButton.Enabled = false;
                startButton.Text = "กำลังดึงข้อมูล...";
                statusLabel.Text = "กำลังประมวลผล กรุณารอสักครู่...";
                Application.DoEvents();

                // 1. หน้าจอ (Monitor)
                string monitorId = GetWmiData("SELECT PNPDeviceID FROM Win32_DesktopMonitor", "PNPDeviceID");
                if (string.IsNullOrEmpty(monitorId) || monitorId.Contains("PNP09FF")) {
                    // Fallback to WmiMonitorID if generic monitor
                    string wmiMonitor = GetWmiData("SELECT InstanceName FROM WmiMonitorID", "InstanceName", "root\\wmi");
                    if (!string.IsNullOrEmpty(wmiMonitor)) monitorId = wmiMonitor;
                }
                
                // 2. แบตเตอรี่ (Battery)
                string battery = GetWmiData("SELECT Name FROM Win32_Battery", "Name");
                
                // 3. เมนบอร์ด (Motherboard)
                string boardModel = GetWmiData("SELECT Product FROM Win32_BaseBoard", "Product");
                string boardSerial = GetWmiData("SELECT SerialNumber FROM Win32_BaseBoard", "SerialNumber");
                string board = (boardModel + " " + boardSerial).Trim();

                // 4. ฮาร์ดดิสก์ (Disk)
                string disk = GetWmiData("SELECT Model FROM Win32_DiskDrive", "Model");

                // 5. แรม (RAM)
                string ramPart = GetWmiData("SELECT PartNumber FROM Win32_PhysicalMemory", "PartNumber");

                // Clean data
                monitorId = monitorId ?? "";
                battery = battery ?? "";
                board = board ?? "";
                disk = disk ?? "";
                ramPart = ramPart ?? "";

                // สร้าง Query String
                string queryParams = string.Format("?monitor={0}&battery={1}&board={2}&disk={3}&ram={4}",
                                     Uri.EscapeDataString(monitorId),
                                     Uri.EscapeDataString(battery),
                                     Uri.EscapeDataString(board),
                                     Uri.EscapeDataString(disk),
                                     Uri.EscapeDataString(ramPart));

                string targetUrl = targetBaseUrl + queryParams;

                // เปิดเบราว์เซอร์
                Process.Start(new ProcessStartInfo
                {
                    FileName = targetUrl,
                    UseShellExecute = true
                });
                
                statusLabel.Text = "สำเร็จ! เปิดหน้าเว็บเรียบร้อยแล้ว";
                startButton.Text = "เริ่มตรวจสอบสเปคเครื่อง";
                startButton.Enabled = true;
            }
            catch (Exception ex)
            {
                MessageBox.Show("พบข้อผิดพลาด: " + ex.Message, "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
                statusLabel.Text = "เกิดข้อผิดพลาดในการดึงข้อมูล";
                startButton.Text = "เริ่มตรวจสอบสเปคเครื่อง";
                startButton.Enabled = true;
            }
        }

        private string GetWmiData(string query, string property, string scope = "root\\cimv2")
        {
            try
            {
                List<string> results = new List<string>();
                ManagementObjectSearcher searcher = new ManagementObjectSearcher(scope, query);
                foreach (ManagementObject queryObj in searcher.Get())
                {
                    if (queryObj[property] != null)
                    {
                        string val = queryObj[property].ToString().Trim();
                        if (!string.IsNullOrEmpty(val) && !results.Contains(val))
                        {
                            results.Add(val);
                        }
                    }
                }
                return string.Join(" | ", results);
            }
            catch 
            { 
                return ""; 
            }
        }

        [STAThread]
        static void Main()
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            Application.Run(new MainForm());
        }
    }
}
