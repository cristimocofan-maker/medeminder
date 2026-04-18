#!/bin/bash

cd /root/medreminder

git checkout dev
git pull

cd backend
npm install
npm run build

cd ../frontend
npm install
npm run build