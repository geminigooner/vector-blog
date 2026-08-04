const text = "here is an image ![img](data:image/png;base64,iVBORw0KGgo) and another ![img2](data:image/jpeg;base64,/9j/4AAQSk)";
const regex = /data:(image\/[a-zA-Z+.-]+);base64,([^\s)"]+)/g;
let match;
while ((match = regex.exec(text)) !== null) {
  console.log("Mime:", match[1]);
  console.log("Data:", match[2].slice(0, 10));
}
