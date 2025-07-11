import React, { useState, useMemo, useRef, useEffect } from "react";
import { Button } from "../ui/button";
import { useCourse } from "@/context/CourseContext";
import { Comment, Resource } from "@/types/types";
import AskQuestion from "@/components/ui/CreateComponent";
import { ChevronDown } from "lucide-react";
import QAListItem from "./QAListItem";
import CommentView from "./CommentView";
import { findChapterId } from "@/utils";
import showAlert from "@/components/ui/AlertC";
import { useCreateOrUpdateCommentMutation } from "@/hooks/useCreateOrUpdateCommentMutation";
type CourseQAListProps = {
  role: "student" | "teacher";
};

const CourseQAList: React.FC<CourseQAListProps> = ({ role }) => {
  const isMounted = useRef<boolean | undefined>(undefined);
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);
  const [showAskQuestionComponent, setShowAskQuestionComponent] =
    useState<boolean>(false);

  const [filter, setFilter] = useState<string>("current_session"); // or all
  const [sort, setSort] = useState<string>("by_date"); // or by_most_upVotes
  const [selectedComment, setSelectedComment] = useState<Comment | null>(null);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(
    null
  );

  const { course, activeResource, refetch } = useCourse();

  const [question, setQuestion] = useState<string>("");
  const createCommentMutation = useCreateOrUpdateCommentMutation({
    onSuccess: async () => {
      if (isMounted.current) {
        setShowAskQuestionComponent(false);
        setQuestion("");
      }
      await refetch();
    },
    onError: () => {
      if (isMounted.current) {
        setShowAskQuestionComponent(false);
      }
      showAlert("warning", "Failed to create the question. Please try again.");
    },
    createOrUpdateCommentRequest: {
      text: question,
      resourceId: activeResource ? activeResource.id : -1,
      chapterId: findChapterId(activeResource, course?.chapters)!,
      courseId: course!.id,
      commentId: null,
    },
  });

  // This code need to change, it is garbage
  useEffect(() => {
    if (course && selectedComment && selectedResource) {
      let updatedComment: Comment | null = null;
      let updatedResource: Resource | null = null;

      course.chapters.forEach((chapter) => {
        chapter.resources.forEach((resource) => {
          const foundComment = resource.comments?.find(
            (c) => c.id === selectedComment.id
          );
          if (foundComment) {
            updatedComment = foundComment;
            updatedResource = resource;
          }
        });
      });

      if (updatedComment && updatedResource) {
        setSelectedComment(updatedComment);
        setSelectedResource(updatedResource);
      } else {
        setSelectedComment(null);
        setSelectedResource(null);
      }
    }
  }, [course, selectedComment, selectedResource]);

  const totalComments = useMemo(() => {
    if (!course?.chapters) return 0;
    return course.chapters.reduce((total, chapter) => {
      const resourceComments = chapter.resources.reduce(
        (sum, resource) => sum + (resource.comments?.length || 0),
        0
      );
      return total + resourceComments;
    }, 0);
  }, [course]);

  const filteredAndSortedComments = useMemo(() => {
    const commentsMap = new Map<Resource, Comment[]>();

    if (filter === "current_session" && activeResource) {
      commentsMap.set(activeResource, activeResource.comments || []);
    } else if (filter === "all" && course?.chapters) {
      course.chapters.forEach((chapter) => {
        chapter.resources.forEach((resource) => {
          if (resource.comments) {
            commentsMap.set(resource, resource.comments);
          }
        });
      });
    }

    // Apply sorting to the comments within each resource
    const sortedCommentsMap = new Map<Resource, Comment[]>();
    Array.from(commentsMap.entries()).forEach(([resource, comments]) => {
      const sortedResourceComments = [...comments].sort((a, b) => {
        if (sort === "by_date") {
          return (
            new Date(b.dateOfCreation).getTime() -
            new Date(a.dateOfCreation).getTime()
          );
        } else if (sort === "by_most_upVotes") {
          return b.upVotes - a.upVotes;
        }
        return 0;
      });
      sortedCommentsMap.set(resource, sortedResourceComments);
    });

    return sortedCommentsMap;
  }, [filter, course, activeResource, sort]);

  if (selectedComment && selectedResource) {
    return (
      <CommentView
        comment={selectedComment}
        resource={selectedResource}
        onClose={() => {
          setSelectedComment(null);
          setSelectedResource(null);
        }}
        onReplyCommentPosted={async () => {
          await refetch();
        }}
        role={role}
      />
    );
  }

  return (
    <div className="w-full bg-white pb-10 p-6 max-w-3xl mx-auto">
      {/* Filter and Sort Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 space-y-4 md:space-y-0">
        <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium text-gray-700">Filters :</p>
            <div className="relative">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-[var(--addi-color-500)] focus:border-[var(--addi-color-500)] appearance-none cursor-pointer"
              >
                {activeResource && (
                  <option value="current_session" className="cursor-pointer">
                    Current Session
                  </option>
                )}
                <option value="all" className="cursor-pointer">
                  All Sessions
                </option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-black pointer-events-none" />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium text-gray-700">Sort by:</p>
            <div className="relative">
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-[var(--addi-color-500)] focus:border-[var(--addi-color-500)] appearance-none cursor-pointer"
              >
                <option value="by_date" className="cursor-pointer">
                  Sort by date (most recent)
                </option>
                <option value="by_most_upVotes" className="cursor-pointer">
                  Sort by most upVotes
                </option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-black pointer-events-none" />
            </div>
          </div>
        </div>

        {role === "student" && (
          <Button
            disabled={!activeResource}
            className="bg-[var(--addi-color-400)] hover:bg-[var(--addi-color-500)] text-white text-md font-semibold"
            onClick={() => {
              if (!activeResource) {
                showAlert("warning", "Please select a session/resource first.");
                return;
              }
              setShowAskQuestionComponent(true);
            }}
          >
            Ask a question
          </Button>
        )}
      </div>

      {/* Questions List */}
      <div>
        <h3 className="text-lg font-bold text-gray-800 mb-4">
          {filter == "all"
            ? `Every question of this course (${totalComments})`
            : `Every question of this session (${
                activeResource?.comments.length || 0
              })`}
        </h3>

        {Array.from(filteredAndSortedComments.entries()).map(
          ([resource, comments]) => (
            <div key={resource.id}>
              {(comments as Comment[]).map((comment) => (
                <QAListItem
                  key={comment.id}
                  comment={comment}
                  resource={resource}
                  onCommentClick={(clickedComment, clickedResource) => {
                    setSelectedComment(clickedComment);
                    setSelectedResource(clickedResource);
                  }}
                />
              ))}
            </div>
          )
        )}
      </div>
      {showAskQuestionComponent && (
        <AskQuestion
          onClose={() => {
            if (isMounted.current) {
              setShowAskQuestionComponent(false);
            }
          }}
          mutation={createCommentMutation}
          onChange={(text) => {
            setQuestion(text);
          }}
          title="Ask Question"
          placeHolder="Enter your question..."
        />
      )}
    </div>
  );
};

export default CourseQAList;
