let [$name, $age] = [Symbol('name'), Symbol('age')]
class student {
  constructor(name, age){ 
    this[$name] = name
    this[$age] = age
  }

  getName(){
    console.log(this[$name])
	  return this[$name]
  }  

  getAge(){
    console.log(this[$age])
	  return this[$age]
  }
}

var stu = new student('hu', 20)

stu.getName();
stu.getAge();

var stu2 = new student('guan', 18)

stu2.getName();
stu2.getAge();