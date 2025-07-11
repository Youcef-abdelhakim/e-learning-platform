"use client";
import CourseSidebar from "@/components/purchasedCourse/CourseSidebar";
import { courseApi } from "@/api/course.api";
import { useMutation, useQuery } from "@tanstack/react-query";
import PurchasedCourseVideo from "@/components/purchasedCourse/PurchasedCourseVideo";
import PurchasedCourseTabs from "@/components/purchasedCourse/PurchasedCourseTabs";
import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Course } from "@/types/types";
import CircularProgress from "@mui/material/CircularProgress";
import Image from "next/image";
import OpenSidebarButton from "./OpenSidebarButton";
import { useAppContext } from "@/context/context";
import { authApi as studentApi } from "@/api/auth/studentAuth.api";
import { authApi as teacherApi } from "@/api/auth/teacherAuth.api";
import PurchasedCourseLoading from "./PurchasedCourseLoading";
import PurchasedCourseError from "./PurchasedCourseError";
import { CourseProvider, useCourse } from "@/context/CourseContext";
import { findChapterId } from "@/utils";
import showAlert from "@/components/ui/AlertC";
import CreateComponent from "@/components/ui/CreateComponent";
import UpdateComponent from "@/components/ui/UpdateComponent";
import DeleteComponent from "@/components/ui/DeleteComponent";
import RedirectComponent from "@/components/ui/RedirectComponent";
import AddResourceComponent from "@/components/ui/AddResourceComponent";
import UpdateResourceComponent from "@/components/ui/UpdateResourceComponent";
import dynamic from "next/dynamic";

const PdfReader = dynamic(() => import("../ui/PdfReader"), { ssr: false });

function Header({ title, isVisible }: { title: string; isVisible: boolean }) {
  return (
    <div
      className={`w-full h-[64px] bg-[#060527] flex items-center px-6 fixed top-0 left-0 z-50 border-b border-[#2d2d2d] transition-transform duration-300 shadow-lg ${
        isVisible ? "translate-y-0" : "-translate-y-full"
      }`}
      id="header-course"
    >
      {/* Logo */}
      <div className="flex items-center mr-8">
        <Image
          src="/logo-e-l.png"
          alt="Logo non disponible"
          width={48}
          height={48}
          className="object-contain hover:brightness-110 transition-all duration-300"
        />
      </div>
      {/* Title */}
      <div className="flex-1">
        <span className="text-black text-lg font-medium">{title}</span>
      </div>
      {/* Right controls */}
      <div className="flex items-center gap-4">
        <div className="flex items-center text-gray-300 text-sm cursor-pointer px-3 py-2 rounded-md transition-colors duration-200">
          <CircularProgress
            className="text-black"
            variant="determinate"
            value={60}
          />
          <p className="text-black mr-1 ml-2 font-semibold">Your progress</p>
          <ChevronDown className="text-black" />
        </div>
      </div>
    </div>
  );
}

function PurchasedCourseContent({
  course,
  role,
}: {
  course: Course;
  role: "student" | "teacher";
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);

  const {
    setCourse,
    setActiveResource,
    activeResource,
    refetch,
    isAddModalOpen,
    setIsAddModalOpen,
    newChapterTitle,
    setNewChapterTitle,
    isUpdateModalOpen,
    setIsUpdateModalOpen,
    chapterToUpdate,
    updatedTitle,
    setUpdatedTitle,
    isDeleteModalOpen,
    setIsDeleteModalOpen,
    chapterToDelete,
    setChapterToDelete,
    resourceToDelete,
    setResourceToDelete,
    isAddResourceModalOpen,
    setIsAddResourceModalOpen,
    isUpdateResourceModalOpen,
    setIsUpdateResourceModalOpen,
    resourceToUpdate,
  } = useCourse();

  useEffect(() => {
    setCourse(course);
  }, [course, setCourse]);

  useEffect(() => {
    setActiveResource(
      course.activeResource && role !== "teacher"
        ? course.activeResource
        : course?.chapters.flatMap((c) => c.resources)[0] || null
    );
  }, [course]);

  const updateActiveResourceMutation = useMutation({
    mutationFn: async ({
      courseId,
      resourceId,
      chapterId,
    }: {
      courseId: number;
      chapterId: number;
      resourceId: number;
    }) => {
      await courseApi.updateActiveResource({
        courseId: courseId,
        resourceId: resourceId,
        chapterId: chapterId,
      });
    },
  });

  useEffect(() => {
    if (activeResource && role !== "teacher") {
      updateActiveResourceMutation.mutate({
        courseId: course.id,
        resourceId: activeResource!.id,
        chapterId: findChapterId(activeResource, course?.chapters)!,
      });
    }
  }, [activeResource]);

  useEffect(() => {
    const header = document.querySelector("#header-course") as HTMLElement;
    const headerHeight = header?.offsetHeight || 64;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY > headerHeight) {
        setIsHeaderVisible(false);
      } else {
        setIsHeaderVisible(true);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isMounted = useRef(false);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const addChapterMutation = useMutation({
    mutationFn: async () => {
      if (!course) return;
      await courseApi.addOrUpdateChapter({
        title: newChapterTitle,
        courseId: course.id,
        chapterId: null,
      });
    },
    onSuccess: async () => {
      if (isMounted.current) {
        setIsAddModalOpen(false);
        setNewChapterTitle("");
      }

      await refetch();
    },
    onError: () => {
      if (isMounted.current) {
        setIsAddModalOpen(false);
      }

      showAlert("warning", "Failed to create a new chapter. Please try again.");
    },
  });

  const updateChapterMutation = useMutation({
    mutationFn: async () => {
      if (!course || !chapterToUpdate) return;
      await courseApi.addOrUpdateChapter({
        title: updatedTitle,
        courseId: course.id,
        chapterId: chapterToUpdate.id,
      });
    },
    onSuccess: async () => {
      setIsUpdateModalOpen(false);
      await refetch();
    },
    onError: () => {
      setIsUpdateModalOpen(false);
      showAlert("warning", "Failed to update the chapter. Please try again.");
    },
  });

  const deleteChapterMutation = useMutation({
    mutationFn: async () => {
      if (!course || !chapterToDelete) return;
      await courseApi.deleteChapter(chapterToDelete.id, course.id);
    },
    onSuccess: async () => {
      setIsDeleteModalOpen(false);
      setChapterToDelete(null);
      await refetch();
    },
    onError: () => {
      setIsDeleteModalOpen(false);
      setChapterToDelete(null);
      showAlert("warning", "Failed to delete the chapter. Please try again.");
    },
  });

  const deleteResourceMutation = useMutation({
    mutationFn: async () => {
      if (!course || !resourceToDelete) return;
      await courseApi.deleteResource(
        findChapterId(resourceToDelete, course.chapters)!,
        course.id,
        resourceToDelete.id
      );
    },
    onSuccess: async () => {
      setIsDeleteModalOpen(false);
      setResourceToDelete(null);
      await refetch();
    },
    onError: () => {
      setIsDeleteModalOpen(false);
      setResourceToDelete(null);
      showAlert("warning", "Failed to delete the resource. Please try again.");
    },
  });

  const [isUploadingResource, setIsUploadingResource] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  return (
    <>
      <Header
        title={course?.title || "Course Title"}
        isVisible={isHeaderVisible}
      />
      <div className="flex flex-row min-h-screen mt-[64px]">
        <div
          className={`flex flex-col flex-1 transition-all duration-300 ${
            isSidebarOpen ? "max-w-[calc(100vw-31vw)]" : "max-w-full"
          }`}
        >
          {!isSidebarOpen && (
            <OpenSidebarButton onOpen={() => setIsSidebarOpen(true)} />
          )}
          {activeResource?.duration !== null ? (
            <PurchasedCourseVideo />
          ) : (
            <PdfReader />
          )}
          <PurchasedCourseTabs role={role} />
        </div>

        <CourseSidebar
          onClose={() => setIsSidebarOpen(false)}
          isSidebarOpen={isSidebarOpen}
          isHeaderVisible={isHeaderVisible}
          role={role}
        />
      </div>
      {isAddModalOpen && course!.ownsCourse && (
        <CreateComponent
          onClose={() => setIsAddModalOpen(false)}
          onChange={setNewChapterTitle}
          mutation={addChapterMutation}
          title="Add New Chapter"
          placeHolder="Enter chapter title..."
        />
      )}
      {isUpdateModalOpen && course!.ownsCourse && chapterToUpdate && (
        <UpdateComponent
          onClose={() => setIsUpdateModalOpen(false)}
          mutation={updateChapterMutation}
          title="Update Chapter Title"
          text={chapterToUpdate.title}
          placeHolder="Enter new chapter title..."
          onChange={setUpdatedTitle}
        />
      )}

      {isDeleteModalOpen && course!.ownsCourse && chapterToDelete && (
        <DeleteComponent
          onClose={() => setIsDeleteModalOpen(false)}
          mutation={deleteChapterMutation}
          title="Delete Chapter"
          text={`Are you sure you want to delete the chapter "${chapterToDelete.title}" ?`}
        />
      )}

      {isDeleteModalOpen && course!.ownsCourse && resourceToDelete && (
        <DeleteComponent
          onClose={() => setIsDeleteModalOpen(false)}
          mutation={deleteResourceMutation}
          title="Delete Resource"
          text={`Are you sure you want to delete the resource "${resourceToDelete.title}" ?`}
        />
      )}

      {isAddResourceModalOpen &&
        course!.ownsCourse &&
        course?.chapters.length > 0 && (
          <AddResourceComponent
            onClose={() => setIsAddResourceModalOpen(false)}
            setIsUploadingResource={setIsUploadingResource}
            setUploadProgress={setUploadProgress}
          />
        )}

      {isUpdateResourceModalOpen &&
        course!.ownsCourse &&
        course?.chapters.length > 0 &&
        resourceToUpdate && (
          <UpdateResourceComponent
            onClose={() => setIsUpdateResourceModalOpen(false)}
            setIsUploadingResource={setIsUploadingResource}
            setUploadProgress={setUploadProgress}
          />
        )}

      {isUploadingResource && (
        <div className="fixed top-0 left-0 w-full z-[9999]">
          <div
            className="h-2 bg-blue-500 transition-all"
            style={{ width: `${uploadProgress}%` }}
          />
        </div>
      )}
    </>
  );
}

export default function PurchasedCourse({
  id,
  role,
}: {
  id: number;
  role: "student" | "teacher";
}) {
  const {
    data: course,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["course", id],
    queryFn: async () => {
      if (role === "student") {
        return await courseApi.getStudentCourseById(Number(id));
      } else {
        return await courseApi.getTeacherCourseById(Number(id));
      }
    },
  });

  const { setStudent, setTeacher, setUser } = useAppContext();
  const { status: studentStatus, refetch: refetchStudent } = useQuery({
    queryKey: ["student"],
    queryFn: async () => {
      const data = await studentApi.me();
      setStudent(data);
      setUser(data);
      return data;
    },
    enabled: role == "student",
  });

  const { status: teacherStatus, refetch: refetchTeacher } = useQuery({
    queryKey: ["teacher"],
    queryFn: async () => {
      const data = await teacherApi.me();
      setTeacher(data);
      setUser(data);
      return data;
    },
    enabled: role == "teacher",
  });

  if (
    isLoading ||
    (studentStatus === "pending" && role === "student") ||
    (teacherStatus === "pending" && role === "teacher")
  ) {
    return <PurchasedCourseLoading />;
  }

  if (isError || studentStatus === "error" || teacherStatus === "error") {
    return (
      <PurchasedCourseError
        onRetry={() => {
          refetch();
          if (role === "student") {
            refetchStudent();
          } else if (role === "teacher") {
            refetchTeacher();
          }
        }}
      />
    );
  }

  if (!(course?.ownsCourse || course?.enrolled)) {
    return (
      <RedirectComponent
        message="You need to purchase this course to access its content"
        redirectTo={`/courseDetails/${id}`}
        delay={5000}
        variant="warning"
      />
    );
  }

  return (
    <CourseProvider initialCourse={course || null} refetch={refetch}>
      <PurchasedCourseContent course={course!} role={role} />
    </CourseProvider>
  );
}
