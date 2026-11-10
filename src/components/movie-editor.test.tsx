import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MovieEditor } from "@/components/movie-editor";
import { api } from "@/lib/api";

const initialMovie = { id: "movie-editor-test", title: "Arrival" };

describe("MovieEditor", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("opens inline editing and cancel restores the saved title", async () => {
    const user = userEvent.setup();
    const put = jest.spyOn(api, "put");
    render(<MovieEditor movie={initialMovie} onSaved={jest.fn()} />);

    await user.click(
      screen.getByRole("button", { name: "Edit favorite movie" }),
    );
    const input = screen.getByRole("textbox", { name: "Favorite movie title" });
    await user.clear(input);
    await user.type(input, "Interstellar");
    await user.click(screen.getByRole("button", { name: /cancel/i }));

    expect(
      screen.getByRole("heading", { name: "Arrival" }),
    ).toBeInTheDocument();
    expect(put).not.toHaveBeenCalled();
  });

  it("submits a trimmed title and keeps the saved update", async () => {
    const user = userEvent.setup();
    const onSaved = jest.fn();
    jest.spyOn(api, "put").mockResolvedValue({
      favoriteMovie: { id: initialMovie.id, title: "Interstellar" },
    });
    render(<MovieEditor movie={initialMovie} onSaved={onSaved} />);

    await user.click(
      screen.getByRole("button", { name: "Edit favorite movie" }),
    );
    const input = screen.getByRole("textbox", { name: "Favorite movie title" });
    await user.clear(input);
    await user.type(input, "  Interstellar  ");
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Interstellar" }),
      ).toBeInTheDocument();
    });
    expect(api.put).toHaveBeenCalledWith(
      "/api/me/movie",
      {
        title: "Interstellar",
      },
      expect.anything(),
    );
    expect(onSaved).toHaveBeenCalledWith({
      id: initialMovie.id,
      title: "Interstellar",
    });
  });

  it("shows the optimistic title while saving and rolls back on failure", async () => {
    const user = userEvent.setup();
    let rejectUpdate: ((reason: Error) => void) | undefined;
    jest.spyOn(api, "put").mockImplementation(
      () =>
        new Promise((_, reject) => {
          rejectUpdate = reject;
        }) as ReturnType<typeof api.put>,
    );
    render(<MovieEditor movie={initialMovie} onSaved={jest.fn()} />);

    await user.click(
      screen.getByRole("button", { name: "Edit favorite movie" }),
    );
    const input = screen.getByRole("textbox", { name: "Favorite movie title" });
    await user.clear(input);
    await user.type(input, "Interstellar");
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(input).toHaveValue("Interstellar");

    rejectUpdate?.(new Error("Request failed"));
    await waitFor(() => expect(input).toHaveValue("Arrival"));
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Your movie could not be updated. Please try again.",
    );
  });

  it("prevents submitting an empty title", async () => {
    const user = userEvent.setup();
    const put = jest.spyOn(api, "put");
    render(<MovieEditor movie={initialMovie} onSaved={jest.fn()} />);

    await user.click(
      screen.getByRole("button", { name: "Edit favorite movie" }),
    );
    await user.clear(
      screen.getByRole("textbox", { name: "Favorite movie title" }),
    );

    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
    fireEvent.submit(
      screen
        .getByRole("textbox", { name: "Favorite movie title" })
        .closest("form")!,
    );
    expect(put).not.toHaveBeenCalled();
  });
});
