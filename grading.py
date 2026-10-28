class Student:
    def __init__(self, name, score):
        self.name = name
        self.score = score

    def grade(self):
        if self.score >= 50:
            return "Pass"
        return "Fail"

    def __str__(self):
        return f"Name: {self.name}, Score: {self.score}"


ada = Student("mavis", 75)
femi = Student("Bernice", 40)

print(ada)
print("Grade:", ada.grade())

print(femi)
print("Grade:", femi.grade())