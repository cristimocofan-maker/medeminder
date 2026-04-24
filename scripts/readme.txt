În PowerShell:

cd E:\medreminder\scripts
.\01_precheck.ps1


cd E:\medreminder\scripts
.\02_backup_server.ps1

$ZZ%@IQMR8#TVf6TcwrXI89

PAS 1 (pe LOCAL)

Rulează:

ssh-keygen -t ed25519

👉 doar Enter, Enter, Enter (nu pune parolă)

🔥 PAS 2

Rulează:

type $env:USERPROFILE\.ssh\id_ed25519.pub | ssh -p 2112 root@89.33.237.149 "cat >> ~/.ssh/authorized_keys"

👉 introdu parola de root o singură dată

🔥 PAS 3 (verificare)
ssh -p 2112 root@89.33.237.149

👉 trebuie să intre FĂRĂ PAROLĂ

🔁 PAS 4

Rulează din nou:

cd E:\medreminder\scripts
.\02_backup_server.ps1