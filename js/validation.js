// function validateEmail() {
//     const email = document.getElementById("wz-button").value;
//     const emailRegex = /\S+@\S+\.\S+/;
//     if (!emailRegex.test(email)) {
//       alert("Please enter a valid email address");
//     } else {
//       // Email is valid, do something here (e.g. submit form)
//       // For example: document.getElementById("myForm").submit();
//     }
//   }
//   if (myObject != null) {
//     // Access myObject properties or methods here
//     var myValue = myObject.value;
//   } else {
//     // Handle the null object case here
//     console.log('myObject is null or undefined');
//   }


var selectElement = document.getElementById("country");

// Get the selected value of the select element
var selectedValue = selectElement.value;

// Perform additional actions based on the selected value
if (selectedValue === "country") {
  console.log("list1");
  // Do something for USA
} else if (selectedValue === "country") {
  console.log("list2");
  // Do something for Canada
} else {
  console.log("list3");
  // Do something for other countries
}