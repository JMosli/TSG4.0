apt update && apt install -y cmake g++ wget unzip ffmpeg libopencv-*

wget -O opencv.zip https://github.com/opencv/opencv/archive/4.x.zip
wget -O opencv_contrib.zip https://github.com/opencv/opencv_contrib/archive/4.x.zip
unzip opencv.zip
unzip opencv_contrib.zip
 
mkdir -p build && cd build
 
cmake -DOPENCV_EXTRA_MODULES_PATH=../opencv_contrib-4.x/modules ../opencv-4.x
cmake --build . -j$(nproc)
make install 

yes | bash <(curl -s "https://raw.githubusercontent.com/ispysoftware/agent-install-scripts/main/v2/install.sh")

mkdir /opt/videokiosk
cd /opt/videokiosk

