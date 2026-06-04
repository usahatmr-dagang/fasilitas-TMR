import subprocess

def run(cmd):
    print(f"Running: {cmd}")
    try:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        print("STDOUT:", result.stdout)
        print("STDERR:", result.stderr)
        print("RETURN CODE:", result.returncode)
    except Exception as e:
        print("ERROR:", e)

run("git --version")
run("git status")
run("git add .")
run("git commit -m \"fix: color card types\"")
run("git push")
