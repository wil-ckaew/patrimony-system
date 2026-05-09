FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt .
RUN python -m pip install --upgrade pip setuptools wheel && \
    pip install --default-timeout=1000 --retries=10 --no-cache-dir \
      --trusted-host pypi.org --trusted-host files.pythonhosted.org \
      -r requirements.txt
COPY . .
EXPOSE 5000
CMD ["python", "-m", "app.main"]
