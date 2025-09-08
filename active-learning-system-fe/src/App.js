
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import CourseComplete from './pupil/CourseComplete';
import CourseModules from './pupil/CourseModules';
import LessonList from './pupil/LessonList';
import QuizPupil from './pupil/QuizPupil';
import CompletedCourses from './pupil/CompletedCourses';
import LearningInterface from './pupil/LearningInterface';
import Register from "./page/Register";
import ForgetPassword from "./page/Forgetpassword";
import ChangePassword from "./page/Changepassword";
import Forget2 from "./page/Forget2";
import Courselist from "./page/Courselist";
import Coursedetail from "./page/Coursedetail";
import Blogdetail from "./page/Blogdetail";
import HomePage from "./page/HomePage";
import Login from "./page/Login";
import Profile from "./page/Profile";
import BlogList from "./page/BlogList";
import AccountList from "./admin/Accountlist";
import ManagerCourseList from "./manager/ManagerCourseList";
import Layout from "./layout";
import Module from "./manager/Module"; // Use ./manager/Module, remove ./Module
import VerifyOtp from "./page/VerifyOtp";
import PaymentResult from "./parent/PaymentResult";
import StudentProgress from "./pupil/StudentProgress";
import ParentProgress from "./parent/ParentProgress";
import QuizzManager from "./instructor/QuizzManager";
import FeedbackForm from "./pupil/FeedbackForm";
import ReportManager from "./manager/ReportManager";
import PaidHistory from "./parent/PaidHistory";
import MyCourseList from "./pupil/MyCourselist";
import UnpaidHistory from "./parent/UnpaidHistory";
import ReportDetail from "./manager/ReportDetail";
import ManageTopicPage from "./manager/ManageTopicPage";
import QuizComplete from "./pupil/QuizComplete";
import InstructorCourselist from "./instructor/InstructorCourselist";
import MarketingCourseList from "./mkt/MarketingCourseList";
import MarketingCourseDetail from "./mkt/MarketingCourseDetail";
import ErrorPage from "./Component/ErrorPage"
import QuizzMarketing from "./mkt/QuizzMarketing";
import MarketerBlog from "./mkt/MarketerBlog";
import LessonInstructor from "./instructor/LessonInstructor";
import QuestionAnswerInstructor from "./instructor/QuestionAnswerInstructor";
import Chatbox from "./page/ChatBox";
import FeedbackMrk from "./mkt/FeedbackMrk";
import FeedbackMrkDetail from "./mkt/FeedbackMrkDetail";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route path="register" element={<Register />} />
          <Route path="login" element={<Login />} />
          <Route path="forget" element={<ForgetPassword />} />
          <Route path="change" element={<ChangePassword />} />
          <Route path="forget2" element={<Forget2 />} />
          <Route path="courselist" element={<Courselist />} />
          <Route path="/course/:courseId" element={<Coursedetail />} />
          <Route path="coursedetail" element={<Coursedetail />} />
          <Route path="blogdetail" element={<Blogdetail />} />
          <Route path="homepage" element={<HomePage />} />
          <Route path="profile" element={<Profile />} />
          <Route path="bloglist" element={<BlogList />} />
          <Route path="/blog/:id" element={<Blogdetail />} />
          <Route path="accountlist" element={<AccountList />} />
          <Route path="managercourselist" element={<ManagerCourseList />} />
          <Route path="/manager/course/:courseId/modules" element={<Module />} />
          <Route path="module" element={<Module />} />
          <Route path="/verify-otp" element={<VerifyOtp />} />
          <Route path="/payment-result" element={<PaymentResult />} />
          <Route path="/student-progress" element={<StudentProgress />} />
          <Route path="/parent-progress/:id" element={<ParentProgress />} />
          <Route path="/quizzes/:moduleId" element={<QuizzManager />} />
          <Route path="/feedback" element={<FeedbackForm />} />
          <Route path="/managerReport" element={<ReportManager />} />
          <Route path="/paid-history" element={<PaidHistory />} />
          <Route path="/my-courses" element={<MyCourseList />} />
          <Route path="/student-progress/:courseId" element={<StudentProgress />} />
          <Route path="/unpaid-history" element={<UnpaidHistory />} />
          <Route path="report-detail/:id" element={<ReportDetail />} />
          <Route path="/managetopicpage" element={<ManageTopicPage />} />
          <Route path="/marketerblog" element={<MarketerBlog />} />
          <Route path="/course-complete" element={<CourseComplete />} />
          <Route path="/completed-courses" element={<CompletedCourses />} />
          <Route path="/learning/:courseId" element={<LearningInterface />} />
          <Route path="/course-modules/:courseId" element={<CourseModules />} />
          <Route path="/course/:courseId/module/:moduleId/lessons" element={<LessonList />} />
          <Route path="/quiz-pupil/:moduleId" element={<QuizPupil />} />
          <Route path="/quiz-complete" element={<QuizComplete />} />
          <Route path="/instructor-courselist" element={<InstructorCourselist />} />
          <Route path="/macourselist" element={<MarketingCourseList />} />
          <Route path="/courses/:courseId" element={<MarketingCourseDetail />} />
          <Route path="/instructor/lesson/:moduleId" element={<LessonInstructor />} />
          <Route path="/instructor/questions" element={<QuestionAnswerInstructor />} />
          <Route path="/error" element={<ErrorPage />} />

          <Route path="/marketing/quizz/:quizzId" element={<QuizzMarketing />} />
          <Route path="/chatbox" element={<Chatbox />} />
          <Route path="/feedback-mrk" element={<FeedbackMrk />} />
          <Route path="/marketer/feedback-detail/:courseId" element={<FeedbackMrkDetail />} />

        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;